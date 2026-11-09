"""Cook ESA CCI Biomass v7 2015–2024 into per-province stock series: public/data/cci/stock-years.json.

Usage: .venv/bin/python scripts/ingest/build_stock_years.py   (after fetch.py)

Raw: the 100 m AGB maps for 2015–2024 and the AGB SD maps for the years compared.
Cooked, per province and nationally:
  agb_mg           all-land aboveground biomass per year, Mg. No forest mask, so a cleared forest shows as a fall.
  flag_ha          land area in each ESA change class, CHANGE_FROM → CHANGE_TO
  flag_agb_mg      summed AGB difference in each class

Why flags and not a subtraction: ESA's Product User Guide v7 (§3, §4) says year-to-year fluctuations are expected
from differing radar acquisitions and strongly advises reading any AGB difference through its quality flag. The
flags here reproduce ESA's own create_change_maps.py, and are checked each build against ESA's published 2019–2020
flag band (meta.validation). CHANGE_FROM is 2017 because the guide notes thinner Sentinel-1 coverage before spring 2017.

Conservation, asserted here and tested in tests/stock-years.test.mjs:
  the 2020 series equals the ledger's agb_mg in every province
  provinces sum to the national series
  the six flag classes sum to the province area
"""
import json

import numpy as np
import rasterio
from rasterio.features import rasterize
from rasterio.merge import merge

import build_ledger as b

OUT = b.Path('public/data/cci/stock-years.json')
YEARS = list(range(2015, 2025))
CHANGE_FROM, CHANGE_TO = 2017, 2024
CLASSES = ['none', 'loss', 'potential_loss', 'no_reliable_change', 'potential_gain', 'gain']
MAX_GROWTH = 10   # Mg/ha/yr, ESA's ceiling on credible annual growth (IPCC 2019)

def tiles(var, year):
    d = {2020: 'cci', 2017: 'cci2017'}.get(year, f'cci_years/{year}')
    paths = sorted((b.RAW / d).glob(f'*_ESACCI-BIOMASS-L4-{var}-MERGED-100m-{year}-fv7.0.tif'))
    assert len(paths) == 6, (var, year, paths)
    return paths

def mosaic(paths, band=1, dtype='float32'):
    ds = [rasterio.open(p) for p in paths]
    arr, tr = merge(ds, bounds=(b.WEST, b.SOUTH, b.EAST, b.NORTH), res=b.PX, nodata=0, indexes=[band], dtype=dtype)
    for d in ds:
        d.close()
    assert arr.shape[1:] == (b.H, b.W) and abs(tr.c - b.WEST) < 1e-9 and abs(tr.f - b.NORTH) < 1e-9, (arr.shape, tr)
    return arr[0]

def change_flags(a1, s1, a2, s2, years):
    """ESA create_change_maps.py v1.0 (2026-01-23), in numpy, on the Thailand window instead of a 10° tile."""
    diff = a2 - a1
    flag = np.full(a1.shape, 3, dtype=np.uint8)
    flag[a2 < a1 - s1] = 2
    flag[a2 > a1 + s1] = 4
    flag[(flag == 4) & (a2 - s2 > a1 + s1)] = 5
    flag[(flag == 2) & (a2 + s2 < a1 - s1)] = 1
    flag[(a2 == 0) & (a1 == 0)] = 0
    flag[diff > years * MAX_GROWTH] = 3
    # Isolated change pixels are relabelled no change. ESA takes a 3×3 median of a 0/1/2 bitmap;
    # the median is 2 exactly when at least five of the nine pixels are "no change".
    no_change = np.pad(flag == 3, 1, mode='symmetric').astype(np.uint8)
    rows = no_change[:-2] + no_change[1:-1] + no_change[2:]
    neighbours = rows[:, :-2] + rows[:, 1:-1] + rows[:, 2:]
    out = flag.copy()
    out[(flag != 3) & (neighbours >= 5)] = 3
    out[flag == 0] = 0
    return out, diff

def main():
    _, feats = b.provinces()
    pcodes = [f['properties']['adm1_pcode'] for f in feats]
    pid = rasterize(((f['geometry'], i + 1) for i, f in enumerate(feats)), out_shape=(b.H, b.W), transform=b.TRANSFORM, fill=0, dtype='uint8')
    area = np.broadcast_to(b.pixel_area_ha()[:, None], (b.H, b.W))
    thai = pid > 0
    tp, ta = pid[thai], area[thai]
    by = lambda v: np.bincount(tp, weights=v, minlength=78)[1:]

    series, agb = np.zeros((77, len(YEARS))), {}
    for j, y in enumerate(YEARS):
        a = mosaic(tiles('AGB', y)).astype(np.float64)
        series[:, j] = by(a[thai] * ta)
        if y in (2019, 2020, CHANGE_FROM, CHANGE_TO):
            agb[y] = a.astype(np.float32)
        b.log(y, f'{series[:, j].sum() / 1e6:,.0f} Mt AGB')
    sd = {y: mosaic(tiles('AGB_SD', y)) for y in agb}

    # Falsifier: our flags against the band ESA published for 2019–2020, on the same pixels.
    ours, _ = change_flags(agb[2019], sd[2019], agb[2020], sd[2020], 1)
    esa = mosaic(sorted((b.RAW / 'cci_diff').glob('*-DIFF-100m-2019_2020-fv7.0.tif')), band=3, dtype='uint8')
    same = float((ours[thai] == esa[thai]).mean())
    changed = (esa[thai] != 3) & (esa[thai] != 0)
    same_changed = float((ours[thai][changed] == esa[thai][changed]).mean())
    b.log('agreement with ESA 2019–2020 flags', same, 'on changed pixels', same_changed)
    assert same > .995 and same_changed > .98, (same, same_changed)

    flag, diff = change_flags(agb[CHANGE_FROM], sd[CHANGE_FROM], agb[CHANGE_TO], sd[CHANGE_TO], CHANGE_TO - CHANGE_FROM)
    fv, dv = flag[thai], np.float64(diff[thai]) * ta
    n = len(CLASSES)
    flag_ha = np.bincount(tp.astype(np.int64) * n + fv, weights=ta, minlength=78 * n).reshape(78, n)[1:]
    flag_mg = np.bincount(tp.astype(np.int64) * n + fv, weights=dv, minlength=78 * n).reshape(78, n)[1:]

    led = {p['pcode']: p for p in json.loads((b.OUT / 'provinces.json').read_text())['provinces']}
    y2020 = YEARS.index(2020)
    for i, pc in enumerate(pcodes):
        assert abs(series[i, y2020] - led[pc]['agb_mg']) <= 1e-4 * max(1, led[pc]['agb_mg']) + 1, (pc, series[i, y2020], led[pc]['agb_mg'])
        assert abs(flag_ha[i].sum() - led[pc]['area_ha']) <= 1e-6 * led[pc]['area_ha'] + .1, (pc, flag_ha[i].sum(), led[pc]['area_ha'])

    def rec(s, fh, fm):
        return {'agb_mg': [round(float(x), 1) for x in s],
                'flag_ha': {c: round(float(x), 1) for c, x in zip(CLASSES, fh)},
                'flag_agb_mg': {c: round(float(x), 1) for c, x in zip(CLASSES, fm)}}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        'meta': {'dataset': 'ESA CCI Biomass AGB', 'version': 'v7.0', 'licence': 'CC BY 4.0', 'resolution': '100 m', 'years': YEARS,
                 'change': {'from': CHANGE_FROM, 'to': CHANGE_TO, 'classes': CLASSES, 'max_growth_mg_ha_yr': MAX_GROWTH,
                            'method': 'ESA create_change_maps.py v1.0 logic: disjoint 1-SD intervals, growth ceiling, 3×3 isolated-pixel filter'},
                 'units': {'agb_mg': 'Mg aboveground biomass, all land', 'flag_ha': 'ha of land', 'flag_agb_mg': 'Mg, summed AGB difference'},
                 'validation': {'against': 'ESA published 2019–2020 quality flag (100 m, Thai land pixels)', 'agreement': round(same, 5), 'agreement_changed_pixels': round(same_changed, 5)},
                 'caveat': 'ESA: year-to-year fluctuations are expected from differing radar observations; change products are research products, to be read through the quality flag.',
                 'source': 'https://dap.ceda.ac.uk/neodc/esacci/biomass/data/agb/maps/v7.0/'},
        'national': rec(series.sum(0), flag_ha.sum(0), flag_mg.sum(0)),
        'provinces': {pc: rec(series[i], flag_ha[i], flag_mg[i]) for i, pc in enumerate(pcodes)},
    }, ensure_ascii=False, separators=(',', ':')) + '\n')
    nat = series.sum(0) / 1e6
    print(OUT, 'national Mt AGB', dict(zip(YEARS, nat.round(0).tolist())))
    print('flags ha', dict(zip(CLASSES, flag_ha.sum(0).round(0).tolist())))

if __name__ == '__main__':
    main()
