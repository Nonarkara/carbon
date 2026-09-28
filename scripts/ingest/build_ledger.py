"""Build the landscape carbon ledger from the files fetched by fetch.py.

Usage: .venv/bin/python scripts/ingest/build_ledger.py

Conservation law: every 100 m ESA CCI pixel centre belongs to at most one Thai province and exactly one
0.025° grid cell. All per-pixel quantities are summed with the same assignment, so for every layer
sum(provinces) == national == sum(grid cells). The script asserts this and the national land area.
"""
import csv, datetime, hashlib, io, json, math, re, zipfile
from pathlib import Path

import h5py
import numpy as np
import rasterio
from PIL import Image
from pyproj import Geod
from rasterio.enums import Resampling
from rasterio.features import rasterize
from rasterio.merge import merge
from rasterio.transform import from_origin
from rasterio.warp import calculate_default_transform, reproject
from shapely.geometry import mapping, shape

AGB_TO_CO2E = (1 + 0.27) * 0.47 * 44 / 12   # must equal public/js/ledger.js AGB_TO_CO2E (tested)

RAW = Path('research/raw/landscape')
OUT = Path('public/data/ledger')
PX = 1 / 1125                       # ESA CCI Biomass pixel (0.000888…°, ~100 m)
WEST, NORTH, EAST, SOUTH = 97.0, 20.8, 106.0, 5.2   # aligned to PX, STEP and 1/120°; encloses every GFED cell touching Thailand
STEP = 0.025                        # browser grid; 10 cells per GFED 0.25° cell, 3 ODIAC 1 km cells
W, H = round((EAST - WEST) / PX), round((NORTH - SOUTH) / PX)
COLS, ROWS = round((EAST - WEST) / STEP), round((NORTH - SOUTH) / STEP)
BLOCK = 2                           # error-correlation block = BLOCK x BLOCK grid cells (0.05°, ~5.6 km); see calibrate_blocks()
TRANSFORM = from_origin(WEST, NORTH, PX, PX)
OFFICIAL_AREA_KM2 = 513120          # Royal Thai Survey Department / NSO land area
GFW_YEARS = 25                      # GFW flux v1.4.3 totals cover 2001–2025
FIRE_YEARS = list(range(2013, 2023))  # GFED5.1 archive ends 2022; ten-year mean

def log(*a):
    print(*a, flush=True)

# ---------- geometry ----------
def provinces():
    z = zipfile.ZipFile(RAW / 'codab/tha_admin_boundaries.geojson.zip')
    name = next(n for n in z.namelist() if re.search(r'adm(in)?1.*\.geojson$', n, re.I))
    fc = json.loads(z.read(name))
    feats = sorted(fc['features'], key=lambda f: f['properties']['adm1_pcode'])
    assert len(feats) == 77, len(feats)
    return name, feats

def pixel_area_ha():
    """Ellipsoidal area (ha) of one CCI pixel in each row, WGS84."""
    geod = Geod(ellps='WGS84')
    lat = NORTH - np.arange(H + 1) * PX
    out = np.empty(H)
    for i in range(H):
        a, _ = geod.polygon_area_perimeter([0, PX, PX, 0], [lat[i + 1], lat[i + 1], lat[i], lat[i]])
        out[i] = abs(a) / 1e4
    return out

def read_mosaic(paths, res, resampling=None, dtype='float32'):
    ds = [rasterio.open(p) for p in paths]
    arr, tr = merge(ds, bounds=(WEST, SOUTH, EAST, NORTH), res=res, nodata=0)
    for d in ds:
        d.close()
    return arr[0], tr

# ---------- layers ----------
def cci(var):
    paths = sorted(RAW.glob(f'cci/*_ESACCI-BIOMASS-L4-{var}-MERGED-100m-2020-fv7.0.tif'))
    assert len(paths) == 6, paths
    arr, tr = read_mosaic(paths, PX)
    assert arr.shape == (H, W) and abs(tr.c - WEST) < 1e-9 and abs(tr.f - NORTH) < 1e-9, (arr.shape, tr)
    return arr.astype(np.float64)

def fnf_fractions():
    """JAXA PALSAR-2 FNF 2020 (1″) averaged onto the CCI grid: forest fraction and land fraction."""
    paths = sorted(RAW.glob('fnf/*.tiff'))
    arr, tr = read_mosaic(paths, 1 / 3600)
    out = {}
    for key, classes in {'forest': (1, 2), 'land': (1, 2, 3)}.items():
        src = np.where(arr == 0, np.nan, np.isin(arr, classes).astype(np.float32))
        dst = np.full((H, W), np.nan, np.float32)
        reproject(src, dst, src_transform=tr, src_crs='EPSG:4326', dst_transform=TRANSFORM, dst_crs='EPSG:4326',
                  src_nodata=np.nan, dst_nodata=np.nan, resampling=Resampling.average)
        out[key] = np.nan_to_num(dst, nan=0.0).astype(np.float64)
    return out['forest'], out['land'], arr

def with_fallback(idx, weight, fallback, ncells):
    """Coarse cells with no FNF land (coastal slivers, small islands) fall back to plain area weighting,
    so no emission is dropped; cells with land keep land weighting."""
    has_land = np.bincount(idx.ravel(), weights=weight.ravel(), minlength=ncells) > 0
    return np.where(has_land[idx], weight, fallback)

def allocate(cell_values, cell_res, cell_west, cell_north, weight, fallback):
    """Spread coarse cell totals over CCI pixels in proportion to `weight` (land area) within each coarse cell."""
    lat = NORTH - (np.arange(H) + .5) * PX
    lon = WEST + (np.arange(W) + .5) * PX
    rows = np.floor((cell_north - lat) / cell_res).astype(np.int64)
    cols = np.floor((lon - cell_west) / cell_res).astype(np.int64)
    ncols, nrows = cell_values.shape[1], cell_values.shape[0]
    inside = ((rows >= 0) & (rows < nrows))[:, None] & ((cols >= 0) & (cols < ncols))[None, :]
    idx = np.where(inside, np.clip(rows, 0, nrows - 1)[:, None] * ncols + np.clip(cols, 0, ncols - 1)[None, :], 0)
    weight = np.where(inside, weight, 0)   # pixels outside the coarse grid (no Thai land there) carry nothing
    weight = with_fallback(idx, weight, np.where(inside, fallback, 0), cell_values.size)
    wsum = np.bincount(idx.ravel(), weights=weight.ravel(), minlength=cell_values.size)
    per_weight = np.divide(cell_values.ravel(), wsum, out=np.zeros(cell_values.size), where=wsum > 0)
    return per_weight[idx] * weight, wsum

def odiac(weight, area):
    total = None
    for m in range(1, 13):
        with rasterio.open(f'/vsigzip/{RAW}/odiac/odiac2025_1km_excl_intl_24{m:02d}.tif.gz') as r:
            win = rasterio.windows.from_bounds(WEST, SOUTH, EAST, NORTH, r.transform)
            a = r.read(1, window=win).astype(np.float64)
            assert abs(r.res[0] - 1 / 120) < 1e-9
            total = a if total is None else total + a
    assert total.shape == (round((NORTH - SOUTH) * 120), round((EAST - WEST) * 120)), total.shape
    total = np.where(total > 0, total, 0)   # tonne C per 1 km cell per year
    per_px, wsum = allocate(total, 1 / 120, WEST, NORTH, weight, area)
    lost = total.ravel()[wsum == 0].sum()   # ODIAC land cells with no land pixel under FNF (reported, not hidden)
    return per_px, total, lost

# ---------- GFED ----------
FIRE_GROUPS = {  # GFED5.1 ecosystem partition index → display group
    'forest': [12], 'savanna_shrub_grass': [8, 9, 10, 11], 'cropland': [14],
    'deforestation': [16], 'peat': [15], 'other': [1, 2, 3, 4, 5, 6, 7, 13],
}
GFED_WEST, GFED_NORTH = 97.0, 20.75   # 0.25° window enclosing the CCI bbox

def gfed_window(ds, lat, lon):
    """Slice (…, lat, lon) GFED array to the Thai window, north-up."""
    r = np.where((lat < GFED_NORTH) & (lat > 5.25))[0]
    c = np.where((lon > GFED_WEST) & (lon < EAST))[0]
    a = ds[..., r.min():r.max() + 1, c.min():c.max() + 1]
    assert abs(lat[r.max()] - (GFED_NORTH - .125)) < 1e-4 and abs(lon[c.min()] - (GFED_WEST + .125)) < 1e-4
    return a[..., ::-1, :]   # GFED latitude ascends; flip to north-up

def gfed():
    """Per year: monthly fire carbon by group (g C per cell) and annual CO2 (g) per 0.25° cell."""
    eco = zipfile.ZipFile(RAW / 'gfed/GFED5.1_ecosystem.zip')
    mon = zipfile.ZipFile(RAW / 'gfed/GFED5.1_monthly.zip')
    carbon, co2 = {}, {}
    for y in FIRE_YEARS:
        with h5py.File(io.BytesIO(eco.read(f'GFED5.1_ecosystem_{y}.nc'))) as f:
            lat, lon = f['lat'][:], f['lon'][:]
            parts = {k: v[:] for k, v in f['carbon_emissions_partitioning'].items()}
            total = gfed_window(f['carbon_emissions'][:], lat, lon).astype(np.float64)
            groups = {}
            for g, ids in FIRE_GROUPS.items():
                groups[g] = sum(gfed_window(v, lat, lon).astype(np.float64)
                                for k, v in parts.items() if int(k.split('_')[1]) in ids)
            assert np.allclose(sum(groups.values()), total, rtol=1e-4, atol=1), f'GFED partition != total {y}'
            carbon[y] = groups
        name = next(n for n in mon.namelist() if re.search(rf'{y}.*\.nc$', n) and '__MACOSX' not in n)
        with h5py.File(io.BytesIO(mon.read(name))) as f:
            co2[y] = co2_from_monthly(f)
    return carbon, co2

def co2_from_monthly(f):
    """Annual fire CO2 (g) per 0.25° cell from GFED5.1 monthly 'CO2' (g CO2 per month)."""
    return gfed_window(f['CO2'][:], f['lat'][:], f['lon'][:]).astype(np.float64).sum(0)

# ---------- crosswalk ----------
def norm(s):
    s = re.sub(r'\bprovince\b|\bmetropolis\b', '', s.lower())
    return re.sub(r'[^a-z]', '', s)

ALIAS = {}  # filled only where GADM and COD-AB spellings differ; asserted 1:1 below

def crosswalk(feats):
    admins = json.loads((RAW / 'climatetrace/admins-THA.json').read_text())
    by_name = {norm(a['name']): a['id'] for a in admins}
    out = {}
    for f in feats:
        en = f['properties']['adm1_name']
        key = ALIAS.get(norm(en), norm(en))
        assert key in by_name, f'no GADM match for {en}'
        out[f['properties']['adm1_pcode']] = by_name[key]
    assert len(set(out.values())) == 77, 'GADM crosswalk is not one-to-one'
    return out

BTR1 = {  # Thailand BTR1 (DCCE, Dec 2024), Table 2-184, p. 2-241 — inventory year 2022, ktCO2eq
    'source': 'https://www.dcce.go.th/wp-content/uploads/2024/12/Submitted-1st-BTR_compressed-1.pdf',
    'table': 'Table 2-184, p. 2-241', 'year': 2022, 'unit': 'ktCO2eq',
    'lulucf_net': -107901.43, 'forest_remaining_emissions': 19675.92, 'forest_remaining_removals': -49003.98,
    'forest_remaining_net': -29328.06, 'cropland_remaining_net': -91486.96, 'land_to_cropland': 12489.37,
    'land_to_other': 154.41, 'biomass_burning_non_co2': 269.81,
}

def share_matrix(cell_idx, weight, wsum, thai, pid, gidx, ncells):
    """Thai share of each coarse cell, split by province and by browser-grid cell (linear allocation)."""
    w = weight[thai] / np.maximum(wsum[cell_idx[thai]], 1e-300)
    by_prov = np.bincount(cell_idx[thai] * 78 + pid[thai], weights=w, minlength=ncells * 78).reshape(ncells, 78)[:, 1:]
    pairs = cell_idx[thai].astype(np.int64) * (COLS * ROWS) + gidx[thai]
    u, inv = np.unique(pairs, return_inverse=True)
    by_grid = np.bincount(inv, weights=w)
    return by_prov, (u // (COLS * ROWS), u % (COLS * ROWS), by_grid)

def gfed_indices(weight, area):
    lat = NORTH - (np.arange(H) + .5) * PX
    lon = WEST + (np.arange(W) + .5) * PX
    rows = np.floor((GFED_NORTH - lat) / .25).astype(np.int64)
    cols = np.floor((lon - GFED_WEST) / .25).astype(np.int64)
    nr, nc = round((GFED_NORTH - 5.25) / .25), round((EAST - GFED_WEST) / .25)
    inside = ((rows >= 0) & (rows < nr))[:, None] & ((cols >= 0) & (cols < nc))[None, :]
    idx = np.where(inside, np.clip(rows, 0, nr - 1)[:, None] * nc + np.clip(cols, 0, nc - 1)[None, :], 0)
    w = with_fallback(idx, np.where(inside, weight, 0), np.where(inside, area, 0), nr * nc)
    return idx, w, np.bincount(idx.ravel(), weights=w.ravel(), minlength=nr * nc), nr * nc

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def overlay(values, name, colours, bounds_ok):
    """North-up EPSG:4326 array (per-ha density, nan = transparent) → Web-Mercator palette PNG for Leaflet."""
    src_tr = TRANSFORM
    dst_tr, dw, dh = calculate_default_transform('EPSG:4326', 'EPSG:3857', W, H, WEST, SOUTH, EAST, NORTH, resolution=556.6)
    dst = np.full((dh, dw), np.nan, np.float32)
    reproject(values.astype(np.float32), dst, src_transform=src_tr, src_crs='EPSG:4326', dst_transform=dst_tr,
              dst_crs='EPSG:3857', src_nodata=np.nan, dst_nodata=np.nan, resampling=Resampling.average)
    idx = np.zeros(dst.shape, np.uint8)
    for i, (lo, _) in enumerate(colours, start=1):
        idx[np.isfinite(dst) & (dst >= lo)] = i
    pal = [0, 0, 0] + [c for _, hexc in colours for c in bytes.fromhex(hexc)]
    img = Image.fromarray(idx, 'P')
    img.putpalette(pal + [0] * (768 - len(pal)))
    img.info['transparency'] = 0
    img.save(OUT / f'overlay-{name}.png', optimize=True, transparency=0)
    return [[SOUTH, WEST], [NORTH, EAST]]

def fnf_classes(fnf):
    """JAXA FNF classes as published (dense / non-dense forest), mode-resampled to Web Mercator."""
    src_tr = from_origin(WEST, NORTH, 1 / 3600, 1 / 3600)
    dst_tr, dw, dh = calculate_default_transform('EPSG:4326', 'EPSG:3857', fnf.shape[1], fnf.shape[0], WEST, SOUTH, EAST, NORTH, resolution=556.6)
    dst = np.zeros((dh, dw), np.uint8)
    reproject(fnf, dst, src_transform=src_tr, src_crs='EPSG:4326', dst_transform=dst_tr, dst_crs='EPSG:3857',
              src_nodata=0, dst_nodata=0, resampling=Resampling.mode)
    idx = np.where(dst == 1, 2, np.where(dst == 2, 1, 0)).astype(np.uint8)   # 1 = forest 10–90 %, 2 = forest >90 %
    img = Image.fromarray(idx, 'P')
    pal = [0, 0, 0, 0x83, 0xef, 0x62, 0x00, 0xb2, 0x00]   # JAXA's own class colour hints
    img.putpalette(pal + [0] * (768 - len(pal)))
    img.save(OUT / 'overlay-fnf.png', optimize=True, transparency=0)

def calibrate_blocks(sd_area, agb_area, area, valid, gidx):
    """Check the block-correlation error model against ESA's own aggregated standard errors.

    ESA CCI aggregates pixel SD with a variance and a covariance term, the correlation of errors estimated from
    airborne LiDAR (CCI Biomass PUG v6, section 5). If pixel errors are fully correlated within BLOCK x BLOCK grid
    cells and independent between blocks, the SD of a coarse cell's mean is sqrt(sum_blocks (sum SD*a)^2) / sum a.
    Report that model / ESA's published SD for every fully valid 0.1° and 0.25° cell over the processing window.
    """
    out = {}
    cell_sd = np.bincount(gidx.ravel(), weights=sd_area.ravel(), minlength=COLS * ROWS).reshape(ROWS, COLS)
    cell_a = np.bincount(gidx.ravel(), weights=area.ravel(), minlength=COLS * ROWS).reshape(ROWS, COLS)
    cell_agb = np.bincount(gidx.ravel(), weights=agb_area.ravel(), minlength=COLS * ROWS).reshape(ROWS, COLS)
    cell_v = np.bincount(gidx.ravel(), weights=valid.ravel().astype(np.float64), minlength=COLS * ROWS).reshape(ROWS, COLS)
    cell_n = np.bincount(gidx.ravel(), minlength=COLS * ROWS).reshape(ROWS, COLS)
    for res, fn in ((0.1, '10000'), (0.25, '25000'), (0.5, '50000')):
        with h5py.File(RAW / f'cci_agg/ESACCI-BIOMASS-L4-AGB-MERGED-{fn}m-fv7.0.nc') as f:
            years = [(datetime.date(1990, 1, 1) + datetime.timedelta(days=float(t))).year for t in f['time'][:]]
            lat, lon, pub = f['lat'][:], f['lon'][:], f['agb_sd'][years.index(2020)].astype(np.float64)
            pub_mean = f['agb'][years.index(2020)].astype(np.float64)
        k = round(res / STEP)
        ratios, mean_ratios = [], []
        for r0 in range(round((NORTH - (math.floor(NORTH / res) * res)) / STEP), ROWS - k + 1, k):
            for c0 in range(round((math.ceil(WEST / res) * res - WEST) / STEP), COLS - k + 1, k):
                if cell_v[r0:r0 + k, c0:c0 + k].sum() < 0.99 * cell_n[r0:r0 + k, c0:c0 + k].sum():
                    continue
                clat, clon = NORTH - (r0 + k / 2) * STEP, WEST + (c0 + k / 2) * STEP
                i, j = np.argmin(abs(lat - clat)), np.argmin(abs(lon - clon))
                if abs(lat[i] - clat) > 1e-6 or abs(lon[j] - clon) > 1e-6 or pub[i, j] <= 0:
                    continue
                sub = cell_sd[r0:r0 + k, c0:c0 + k]
                blocks = sub.reshape(k // BLOCK, BLOCK, k // BLOCK, BLOCK).sum(axis=(1, 3))
                model = math.sqrt((blocks ** 2).sum()) / cell_a[r0:r0 + k, c0:c0 + k].sum()
                ratios.append(model / pub[i, j])
                mean_ratios.append(pub_mean[i, j] / (cell_agb[r0:r0 + k, c0:c0 + k].sum() / cell_a[r0:r0 + k, c0:c0 + k].sum()))
        r = np.array(ratios)
        out[f'{res}deg'] = {'cells': int(r.size), 'model_over_esa_median': round(float(np.median(r)), 3),
                            'model_over_esa_p25': round(float(np.percentile(r, 25)), 3), 'model_over_esa_p75': round(float(np.percentile(r, 75)), 3),
                            # ESA's aggregate mean ÷ mean recomputed from the 100 m tiles; not 1 because the aggregates come from another processing run
                            'esa_mean_over_recomputed_median': round(float(np.median(mean_ratios)), 3)}
    return out

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    zname, feats = provinces()
    pcodes = [f['properties']['adm1_pcode'] for f in feats]
    gadm = crosswalk(feats)
    log('rasterising provinces', W, H)
    pid = rasterize(((f['geometry'], i + 1) for i, f in enumerate(feats)), out_shape=(H, W), transform=TRANSFORM,
                    fill=0, dtype='uint8')
    area = np.broadcast_to(pixel_area_ha()[:, None], (H, W))
    thai = pid > 0
    gr = ((np.arange(H) + .5) * PX // STEP).astype(np.int64)
    gc = ((np.arange(W) + .5) * PX // STEP).astype(np.int64)
    gidx = gr[:, None] * COLS + gc[None, :]

    log('JAXA FNF')
    forest_frac, land_frac, fnf = fnf_fractions()
    log('CCI AGB / SD')
    agb_ha, sd_ha = cci('AGB'), cci('AGB_SD')
    fields = {
        'area_ha': area * 1.0,
        'forest_area_ha': area * forest_frac,
        'agb_mg': agb_ha * area,
        'forest_agb_mg': agb_ha * area * forest_frac,
        'forest_sd_mg': sd_ha * area * forest_frac,
        'forest_var_mg2': (sd_ha * area * forest_frac) ** 2,
    }
    density = np.where(thai, agb_ha * forest_frac * AGB_TO_CO2E, np.nan)
    sd_all, agb_all, agb_valid = sd_ha * area, agb_ha * area, agb_ha > 0   # all land, for calibrate_blocks (ESA aggregates are per pixel area)
    del sd_ha
    land_w = area * land_frac
    log('ODIAC')
    fields['fossil_c_t'], odiac_raw, odiac_lost = odiac(land_w, area)

    # cross-check: ODIAC cells whose centre pixel is Thai (a different, cruder assignment)
    centre = lambda n: ((np.arange(n) + .5) * 1125 / 120).astype(np.int64)
    ctr = pid[centre(odiac_raw.shape[0])[:, None], centre(odiac_raw.shape[1])[None, :]] > 0
    odiac_centre_thai = float(odiac_raw[ctr].sum())
    thai_pid, thai_g = pid[thai], gidx[thai]
    log('error-correlation calibration against ESA aggregates')
    calibration = calibrate_blocks(sd_all, agb_all, area, agb_valid, gidx)
    del sd_all, agb_all, agb_valid
    log(calibration)
    prov, grid, nat = {}, {}, {}
    for k, v in fields.items():
        vals = v[thai]
        prov[k] = np.bincount(thai_pid, weights=vals, minlength=78)[1:]
        grid[k] = np.bincount(thai_g, weights=vals, minlength=COLS * ROWS)
        nat[k] = float(vals.sum())
    # Stock uncertainty, central model: errors fully correlated within BLOCK x BLOCK grid cells, independent between.
    blk = (thai_g // COLS // BLOCK) * (COLS // BLOCK) + (thai_g % COLS) // BLOCK
    nb = (COLS // BLOCK) * (ROWS // BLOCK)
    sdv = fields['forest_sd_mg'][thai]
    pb = np.bincount(blk * 78 + thai_pid, weights=sdv, minlength=nb * 78).reshape(nb, 78)[:, 1:]
    prov['forest_blockvar_mg2'] = (pb ** 2).sum(0)
    nat['forest_blockvar_mg2'] = float((np.bincount(blk, weights=sdv, minlength=nb) ** 2).sum())
    del fields

    log('GFED')
    carbon, co2 = gfed()
    fidx, fw, fwsum, ncell = gfed_indices(land_w, area)
    by_prov, (cells_of_g, grid_cells, gshare) = share_matrix(fidx, fw, fwsum, thai, pid, gidx, ncell)
    fire = {'years': {}, 'monthly': np.zeros((12, 77)), 'groups': {g: np.zeros(77) for g in FIRE_GROUPS}}
    fire_nat = {'years': {}, 'monthly': np.zeros(12), 'groups': {g: 0.0 for g in FIRE_GROUPS}}
    co2_mean_cells = np.zeros(ncell)
    for y in FIRE_YEARS:
        month_c = sum(carbon[y].values()).reshape(12, -1) / 1e6          # g C → t C, per coarse cell
        fire['monthly'] += month_c @ by_prov / len(FIRE_YEARS)
        fire_nat['monthly'] += (month_c @ by_prov).sum(1) / len(FIRE_YEARS)
        for g, arr in carbon[y].items():
            annual = arr.sum(0).ravel() / 1e6 @ by_prov
            fire['groups'][g] += annual / len(FIRE_YEARS)
            fire_nat['groups'][g] += annual.sum() / len(FIRE_YEARS)
        fire['years'][y] = month_c.sum(0) @ by_prov
        fire_nat['years'][y] = float(fire['years'][y].sum())
        co2_mean_cells += co2[y].ravel() / 1e6 / len(FIRE_YEARS)          # g CO2 → t CO2
    prov['fire_co2_t'] = co2_mean_cells @ by_prov
    grid['fire_co2_t'] = np.bincount(grid_cells, weights=co2_mean_cells[cells_of_g] * gshare, minlength=COLS * ROWS)
    nat['fire_co2_t'] = float(prov['fire_co2_t'].sum())

    # ---- conservation checks ----
    for k in grid:
        for name, s in (('provinces', prov[k].sum()), ('grid', grid[k].sum())):
            assert math.isclose(s, nat[k], rel_tol=1e-9, abs_tol=1e-3), (k, name, s, nat[k])
    area_km2 = nat['area_ha'] / 100
    assert abs(area_km2 / OFFICIAL_AREA_KM2 - 1) < 0.01, area_km2
    codab_km2 = sum(f['properties']['area_sqkm'] for f in feats)
    log(f'area {area_km2:.0f} km2 (official {OFFICIAL_AREA_KM2}, COD-AB attribute {codab_km2:.0f})')

    # ---- GFW province flux (keyless ADM1 summary) ----
    gfw = {r['adm1']: r for r in csv.DictReader(open(RAW / 'gfw/carbonflux_adm1_tha_tcd30.csv'))}
    gfw_area = {r['adm1']: float(r['area_ha']) for r in csv.DictReader(open(RAW / 'gfw/carbonflux_adm1_tha_area.csv'))}
    assert len(gfw) == 77 and len(gfw_area) == 77
    ratios = []
    for i, pc in enumerate(pcodes):
        n = gadm[pc].split('.')[1].split('_')[0]
        ratios.append(gfw_area[n] / (prov['area_ha'][i]))
    worst = max(abs(r - 1) for r in ratios)
    log(f'GFW/GADM vs COD-AB province area: worst deviation {worst:.3f}')
    assert worst < 0.15, 'GADM crosswalk looks misnumbered'

    # ---- Climate TRACE cross-check ----
    ct = {}
    for pc in pcodes:
        d = json.loads((RAW / f'climatetrace/{gadm[pc]}-2024.json').read_text())
        ct[pc] = {s['subsector']: s['emissionsQuantity'] for s in d.get('subsectors', {}).get('summaries', [])}

    records = []
    for i, (pc, f) in enumerate(zip(pcodes, feats)):
        n = gadm[pc].split('.')[1].split('_')[0]
        g = gfw[n]
        rec = {'pcode': pc, 'name_en': f['properties']['adm1_name'], 'name_th': f['properties']['adm1_name1'],
               'gadm': gadm[pc], **{k: float(prov[k][i]) for k in prov},
               'gfw_removals_mg_co2': float(g['removals_mg_co2']), 'gfw_emissions_mg_co2e': float(g['emissions_mg_co2e']),
               'gfw_net_mg_co2e': float(g['net_mg_co2e']), 'gfw_extent_ha': float(g['extent_ha']),
               'fire_c_t_years': {str(y): float(fire['years'][y][i]) for y in FIRE_YEARS},
               'fire_c_t_monthly': [float(x) for x in fire['monthly'][:, i]],
               'fire_c_t_groups': {k: float(v[i]) for k, v in fire['groups'].items()},
               'climatetrace_2024': {k: ct[pc].get(k) for k in ('forest-land-fires', 'forest-land-clearing', 'net-forest-land', 'removals')}}
        records.append(rec)
    national = {'pcode': 'TH', 'name_en': 'Thailand', 'name_th': 'ประเทศไทย', **nat,
                **{k: sum(r[k] for r in records) for k in ('gfw_removals_mg_co2', 'gfw_emissions_mg_co2e', 'gfw_net_mg_co2e', 'gfw_extent_ha')},
                'fire_c_t_years': {str(y): fire_nat['years'][y] for y in FIRE_YEARS},
                'fire_c_t_monthly': [float(x) for x in fire_nat['monthly']],
                'fire_c_t_groups': {k: float(v) for k, v in fire_nat['groups'].items()},
                'btr1_2022': BTR1}

    def rnd(o):
        if isinstance(o, float): return float(f'{o:.6g}') if abs(o) < 1e5 else round(o, 1)
        if isinstance(o, dict): return {k: rnd(v) for k, v in o.items()}
        if isinstance(o, list): return [rnd(v) for v in o]
        return o
    (OUT / 'provinces.json').write_text(json.dumps(rnd({'national': national, 'provinces': records}), ensure_ascii=False, separators=(',', ':')) + '\n')

    # ---- sparse grid ----
    order = ['forest_agb_mg', 'forest_sd_mg', 'forest_var_mg2', 'agb_mg', 'area_ha', 'forest_area_ha', 'fossil_c_t', 'fire_co2_t']
    keep = np.nonzero(grid['area_ha'] > 0)[0].astype(np.uint32)
    buf = keep.astype('<u4').tobytes() + b''.join(grid[k][keep].astype('<f4').tobytes() for k in order)
    (OUT / 'grid.bin').write_bytes(buf)
    grid_meta = {'west': WEST, 'north': NORTH, 'step': STEP, 'cols': COLS, 'rows': ROWS, 'block': BLOCK, 'count': int(keep.size), 'layers': order,
                 'layout': 'Uint32 cell index (row*cols+col), then Float32 per layer; little-endian; additive totals per cell'}

    # ---- province geometry for display (simplified; ledger uses full-resolution rasterisation) ----
    disp = {'type': 'FeatureCollection', 'features': []}
    for f in feats:
        geom = shape(f['geometry']).simplify(0.004, preserve_topology=True)
        gj = json.loads(json.dumps(mapping(geom)), parse_float=lambda x: round(float(x), 4))
        disp['features'].append({'type': 'Feature', 'properties': {'pcode': f['properties']['adm1_pcode'],
                                 'name_en': f['properties']['adm1_name'], 'name_th': f['properties']['adm1_name1']}, 'geometry': gj})
    (OUT / 'provinces.geojson').write_text(json.dumps(disp, ensure_ascii=False, separators=(',', ':')) + '\n')

    # ---- overlays ----
    log('overlays')
    bounds = overlay(density, 'stock', [(1, 'e5efd8'), (50, 'bcd9a3'), (100, '8fbf6f'), (200, '5f9e48'), (350, '356f2e'), (500, '17441c')], True)  # colours must match the legend in landscape.js
    fnf_classes(fnf)

    # ---- manifest ----
    fetchlog = json.loads((RAW / 'fetch-log.json').read_text())
    def files(prefix): return {k: {'sha256': v['sha256'], 'bytes': v['bytes'], 'retrieved': v['retrieved'], 'url': v['url']} for k, v in fetchlog.items() if k.startswith(prefix) and 'sha256' in v}
    manifest = {
        'schemaVersion': 1, 'pipeline': 'scripts/ingest/build_ledger.py', 'pipelineSha256': sha(__file__),
        'conservation': {'rule': 'each CCI 100 m pixel centre → ≤1 province and 1 grid cell; sum(provinces) == national == sum(grid) for every layer',
                         'area_km2': round(area_km2, 1), 'official_area_km2': OFFICIAL_AREA_KM2, 'codab_area_km2': round(codab_km2, 1),
                         'gfw_gadm_area_worst_deviation': round(worst, 4), 'odiac_tc_unallocated_in_window': round(float(odiac_lost), 1),
                         'odiac_thai_tc_pixel_allocation': round(nat['fossil_c_t'], 1), 'odiac_thai_tc_cell_centre': round(odiac_centre_thai, 1)},
        'uncertainty': {
            'bounds': {'independent': 'pixel errors independent (floor)', 'block': f'errors fully correlated within {BLOCK}x{BLOCK} grid cells ({BLOCK * STEP:g}°), independent between blocks (central)',
                       'correlated': 'all pixel errors fully correlated (ceiling)'},
            'block_deg': BLOCK * STEP,
            'calibration': {'method': "Block model vs ESA CCI v7.0 published 2020 aggregate AGB SD (variance + LiDAR-estimated covariance, PUG v6 §5) over fully valid cells in the processing window. Calibration uses all-land pixel SD (ESA aggregates are per pixel area); province and box ranges use forest-weighted SD with the same block assumption.",
                            'results': calibration,
                            'note': 'Ratio > 1 means the block model is wider than ESA. ESA aggregates were produced by a different processing run (BIOMASAR v202509) from the 100 m tiles (v202510), so this is consistency, not exact reproduction. Scales above 50 km (provinces, nation) are extrapolated: errors are assumed independent beyond one block, and correlated retrieval or allometric bias is not covered.'},
            'excludes': 'systematic map bias; root:shoot and carbon-fraction choice',
        },
        'grid': grid_meta, 'overlayBounds': bounds,
        'conversion': {'agb_to_co2e': AGB_TO_CO2E, 'root_shoot': 0.27, 'carbon_fraction': 0.47, 'c_to_co2': 44 / 12,
                       'basis': 'TGO T-VER-S-TOOL-01-01 v2 general-tree convention'},
        'datasets': {
            'cci': {'name': 'ESA CCI Biomass AGB', 'version': 'v7.0', 'year': 2020, 'resolution': '100 m', 'unit': 'Mg/ha (AGB, SD)',
                    'doi': '10.5285/6429d1aafe1e43b9b414e4a5a7f8b903', 'licence': 'ESA CCI data policy: free use with acknowledgement and DOI citation',
                    'files': files('cci/')},
            'fnf': {'name': 'JAXA ALOS-2 PALSAR-2 Forest/Non-Forest', 'version': 'v2.1.0', 'year': 2020, 'resolution': '25 m (served at 1″)',
                    'forest_classes': [1, 2], 'licence': 'JAXA Terms of Use of Research Data (credit JAXA; notify JAXA before commercial use)',
                    'url': 'https://data.earth.jaxa.jp/', 'files': {'tiles': len(files('fnf/'))}},
            'gfw': {'name': 'GFW forest carbon flux (Harris et al. 2021; Gibbs et al. 2025)', 'version': 'v1.4.3 (data-api v20260327)',
                    'period': '2001–2025', 'years': GFW_YEARS, 'tree_cover_threshold': 30, 'unit': 'Mg CO2e over the period',
                    'licence': 'CC BY 4.0', 'files': files('gfw/'), 'grid': None},
            'gfed': {'name': 'GFED5.1', 'period': f'{FIRE_YEARS[0]}–{FIRE_YEARS[-1]}', 'resolution': '0.25°', 'cellKm': 28,
                     'unit': 'fire carbon (t C) and CO2 (t CO2)', 'doi': '10.5281/zenodo.16794692', 'licence': 'CC BY 4.0', 'files': files('gfed/')},
            'odiac': {'name': 'ODIAC fossil CO2', 'version': 'ODIAC2025', 'year': 2024, 'resolution': '1 km', 'cellKm': 1,
                      'unit': 'tonne C per cell (converted ×44/12)', 'doi': '10.17595/20170411.001', 'licence': 'CC BY 4.0', 'files': files('odiac/')},
            'codab': {'name': 'Thailand subnational boundaries (COD-AB, RTSD via OCHA/HDX)', 'version': 'v01 (valid 2022-01-22)', 'licence': 'CC BY-IGO',
                      'files': files('codab/')},
            'climatetrace': {'name': 'Climate TRACE', 'version': 'API v7', 'year': 2024, 'unit': 't CO2e (100-yr GWP)', 'licence': 'CC BY 4.0',
                             'files': {'provinces': 77}},
            'btr1': {'name': "Thailand's First Biennial Transparency Report", 'year': 2022, 'citation': BTR1['table'], 'url': BTR1['source']},
        },
    }
    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n')
    for p in sorted(OUT.iterdir()):
        log(p.name, p.stat().st_size)

if __name__ == '__main__':
    main()
