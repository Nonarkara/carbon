"""Check ESA CCI Biomass against Thailand's national forest inventory (NFI), at national scale.

Usage: .venv/bin/python scripts/ingest/nfi_check.py   (after fetch.py; writes public/data/ledger/nfi-check.json)

Reference: Thailand's FREL/FRL submission to the UNFCCC (modified July 2021):
  Table 13  NFI cycle 3 (median plot year 2017): mean aboveground biomass per forest type, half 95% CI.
  Table 6/7 stratified area estimates of forest in 2016 (stable + gain) and their CIs.
Map side: ESA CCI Biomass v7.0 for 2017, weighted by the JAXA PALSAR-2 FNF 2017 forest fraction, over Thai land.

Stratum means are compared, never plots with pixels (0.1 ha plots vs ~1 ha pixels; Réjou-Méchain et al. 2019).
The two forest definitions differ: the NFI samples forest as defined for Thailand's reference level (plantations
count as non-forest except teak), while radar FNF counts any tree canopy ≥10% over ≥0.5 ha, including rubber and
orchards. Because NFI forest is essentially a subset of FNF forest, the check is a bound: if the map were unbiased
on NFI forest, the extra FNF tree cover would have to hold the rest of the map's biomass. The implied density of
that remainder is reported, so a reader can judge whether it is plausible.

A forest-type comparison with the Copernicus LC100 2017 forest-type layer was tried and rejected: it labels ~97% of
Thai forest evergreen, against the FREL's ~34% evergreen / ~64% deciduous, so its strata do not match the NFI's.
"""
import json, math
from pathlib import Path

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.features import rasterize
from rasterio.warp import reproject

import build_ledger as b

FREL = {
    'source': 'Thailand FREL/FRL submission to the UNFCCC (modified July 2021): Table 13 (NFI cycle 3), Tables 6–7 (2016 area)',
    'url': 'https://redd.unfccc.int/media/modified_thailand_rl_july2021.pdf',
    'median_year': 2017,
    # mean AGB (t/ha) and half 95% CI (%) — Table 13, cycle 3
    'agb': {'evergreen': (136.327, 8), 'deciduous': (65.465, 7), 'mangrove': (120.779, 18)},
    # 2016 area (ha): stable from 2006 + gain from non-forest, with half 95% CI (%) — Tables 6 and 7
    'area': {'evergreen': ((5892252, 8), (9364, 36)), 'deciduous': ((10985093, 5), (100677, 93)), 'mangrove': ((201668, 7), (39669, 184))},
    # carbon stock per type, tCO2/ha, Table 13 cycle 3 = AGB × (1 + RS) × 0.47 × 44/12 with RS 0.37 / 0.20 / 0.49 (Table 11)
    'stock_tco2_ha': {'evergreen': 321.864, 'deciduous': 135.381, 'mangrove': 310.134},
}
CGLS = b.RAW / 'cgls/PROBAV_LC100_global_v3.0.1_2017-conso_Forest-Type-layer_EPSG-4326.tif'

def nfi_national():
    """Area-weighted NFI mean and total, with first-order error propagation (independent terms)."""
    total, var, area, avar, per = 0.0, 0.0, 0.0, 0.0, {}
    for t, (m, cm) in FREL['agb'].items():
        a_t = sum(a for a, _ in FREL['area'][t])
        va_t = sum((a * c / 100 / 1.96) ** 2 for a, c in FREL['area'][t])
        sm = m * cm / 100 / 1.96
        total += a_t * m
        var += (a_t * sm) ** 2 + va_t * m ** 2
        area += a_t
        avar += va_t
        per[t] = {'area_ha': a_t, 'agb_t_ha': m}
    se_total, se_area = math.sqrt(var), math.sqrt(avar)
    mean = total / area
    se_mean = mean * math.sqrt((se_total / total) ** 2 + (se_area / area) ** 2)
    stock = sum(sum(a for a, _ in FREL['area'][t]) * FREL['stock_tco2_ha'][t] for t in FREL['agb'])
    stock_var = sum((sum(a for a, _ in FREL['area'][t]) * FREL['stock_tco2_ha'][t] * FREL['agb'][t][1] / 100 / 1.96) ** 2
                    + sum((a * c / 100 / 1.96) ** 2 for a, c in FREL['area'][t]) * FREL['stock_tco2_ha'][t] ** 2 for t in FREL['agb'])
    return {'carbon_stock_tco2e': stock, 'carbon_stock_ci95_tco2e': 1.96 * math.sqrt(stock_var), 'forest_area_ha': area, 'forest_area_ci95_ha': 1.96 * se_area, 'agb_total_t': total, 'agb_total_ci95_t': 1.96 * se_total,
            'agb_mean_t_ha': mean, 'agb_mean_ci95_t_ha': 1.96 * se_mean, 'by_type': per}

def cci2017(var):
    paths = sorted(b.RAW.glob(f'cci2017/*_ESACCI-BIOMASS-L4-{var}-MERGED-100m-2017-fv7.0.tif'))
    assert len(paths) == 6, paths
    arr, _ = b.read_mosaic(paths, b.PX)
    assert arr.shape == (b.H, b.W)
    return arr.astype(np.float64)

def fnf2017_fraction():
    paths = sorted(b.RAW.glob('fnf2017/*.tiff'))
    arr, tr = b.read_mosaic(paths, 1 / 3600)
    src = np.where(arr == 0, np.nan, np.isin(arr, (1, 2)).astype(np.float32))
    dst = np.full((b.H, b.W), np.nan, np.float32)
    reproject(src, dst, src_transform=tr, src_crs='EPSG:4326', dst_transform=b.TRANSFORM, dst_crs='EPSG:4326',
              src_nodata=np.nan, dst_nodata=np.nan, resampling=Resampling.average)
    return np.nan_to_num(dst, nan=0.0).astype(np.float64)

def cgls_sanity(thai, area):
    dst = np.zeros((b.H, b.W), np.uint8)
    with rasterio.open(CGLS) as r:
        win = rasterio.windows.from_bounds(b.WEST - .01, b.SOUTH - .01, b.EAST + .01, b.NORTH + .01, r.transform)
        reproject(r.read(1, window=win), dst, src_transform=r.window_transform(win), src_crs=r.crs, dst_transform=b.TRANSFORM,
                  dst_crs='EPSG:4326', src_nodata=255, dst_nodata=0, resampling=Resampling.nearest)
    ev = float(area[thai & np.isin(dst, (1, 2))].sum())
    de = float(area[thai & np.isin(dst, (3, 4))].sum())
    return {'layer': 'Copernicus Global Land Service LC100 v3.0.1, 2017, forest-type layer (CC BY 4.0)',
            'evergreen_ha': round(ev), 'deciduous_ha': round(de), 'evergreen_share': round(ev / (ev + de), 3),
            'frel_evergreen_share': round(5901616 / (5901616 + 11085770), 3), 'used': False,
            'reason': 'Leaf-phenology labels put almost all Thai forest in the evergreen class, unlike the NFI forest types; strata would not match.'}

def main():
    _, feats = b.provinces()
    pid = rasterize(((f['geometry'], i + 1) for i, f in enumerate(feats)), out_shape=(b.H, b.W), transform=b.TRANSFORM, fill=0, dtype='uint8')
    thai = pid > 0
    area = np.broadcast_to(b.pixel_area_ha()[:, None], (b.H, b.W))
    agb, sd = cci2017('AGB'), cci2017('AGB_SD')
    ff = fnf2017_fraction()
    gr = ((np.arange(b.H) + .5) * b.PX // b.STEP).astype(np.int64)
    gc = ((np.arange(b.W) + .5) * b.PX // b.STEP).astype(np.int64)
    blk = (gr[:, None] // b.BLOCK) * (b.COLS // b.BLOCK) + gc[None, :] // b.BLOCK

    w = (area * ff)[thai]
    fa = float(w.sum())
    ft = float((agb[thai] * w).sum())
    blocks = np.bincount(blk[thai], weights=sd[thai] * w)
    se_t = math.sqrt(float((blocks ** 2).sum()))
    nfi = nfi_national()
    remainder_area = fa - nfi['forest_area_ha']
    implied = (ft - nfi['agb_total_t']) / remainder_area
    out = {
        'nfi': {k: FREL[k] for k in ('source', 'url', 'median_year')} | {'national': {k: (round(v, 1) if isinstance(v, float) else v) for k, v in nfi.items()}},
        'map': {'agb': 'ESA CCI Biomass v7.0, 2017, 100 m', 'forest': 'JAXA ALOS-2 PALSAR-2 FNF v2.1.0, 2017, forest fraction (classes 1–2)',
                'forest_area_ha': round(fa, 1), 'agb_total_t': round(ft, 1), 'agb_total_ci95_t_block_model': round(1.96 * se_t, 1),
                'agb_mean_t_ha': round(ft / fa, 2)},
        'comparison': {
            'mean_ratio_map_over_nfi': round((ft / fa) / nfi['agb_mean_t_ha'], 3),
            'total_ratio_map_over_nfi': round(ft / nfi['agb_total_t'], 3),
            'extra_fnf_forest_ha': round(remainder_area, 1),
            'implied_agb_t_ha_of_extra_tree_cover_if_map_unbiased_on_nfi_forest': round(implied, 1),
            'reading': 'If the map were unbiased on NFI forest, the extra FNF tree cover would have to average the implied density above.',
            # map mean on NFI forest ÷ NFI mean, for assumed densities of the extra tree cover
            'map_over_nfi_on_nfi_forest_if_extra_holds': {str(d): round((ft - remainder_area * d) / nfi['forest_area_ha'] / nfi['agb_mean_t_ha'], 2) for d in (0, 100, 136, 200)},
        },
        'cgls_forest_type_check': cgls_sanity(thai, area),
        'caveats': [
            'Different forest definitions: NFI forest excludes plantations other than teak; FNF counts any tree canopy ≥10% over ≥0.5 ha.',
            'Different years: NFI cycle 3 plots span 2012–2018 (median 2017); the map is 2017 and the FREL areas are 2016.',
            'The NFI totals propagate the published half 95% CIs as independent terms; map uncertainty is the ledger block model (random error only).',
            'National scale only. Not a correction for any province, box or parcel.',
        ],
    }
    Path('public/data/ledger/nfi-check.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(json.dumps(out['nfi']['national'], indent=0)); print(json.dumps(out['map'], indent=0)); print(json.dumps(out['comparison'], indent=0)); print(out['cgls_forest_type_check'])

if __name__ == '__main__':
    main()
