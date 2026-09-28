"""Download the landscape-ledger source files into research/raw/landscape/ and record provenance.

Usage: .venv/bin/python scripts/ingest/fetch.py
Re-runs skip files already present. fetch-log.json records URL, bytes, SHA-256 and retrieval time.
No credentials are used; GFW 30 m flux tiles need a key and are deliberately not fetched here.
"""
import hashlib, json, os, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

RAW = Path('research/raw/landscape')
LOG = RAW / 'fetch-log.json'
CCI = 'https://dap.ceda.ac.uk/neodc/esacci/biomass/data/agb/maps/v7.0/geotiff/2020/'
FNF = 'https://s3.ap-northeast-1.wasabisys.com/je-pds/cog/v1/JAXA.EORC_ALOS-2.PALSAR-2_FNF.v2.1.0_global_yearly/2020/3/'
ODIAC = 'https://db.cger.nies.go.jp/nies_data/10.17595/20170411.001/odiac2025/1km_tiff/2024/'
GFW_SQL = ('select adm1, sum("gfw_full_extent_gross_removals__Mg_CO2") as removals_mg_co2, '
           'sum("gfw_full_extent_gross_emissions_biomass_soil__Mg_CO2e") as emissions_mg_co2e, '
           'sum("gfw_full_extent_net_flux__Mg_CO2e") as net_mg_co2e, sum("gfw_flux_model_extent__ha") as extent_ha '
           "from data where iso='THA' and is__flux_model_extent = true and umd_tree_cover_density_2000__threshold=30 "
           'group by adm1 order by adm1')
GFW_AREA_SQL = ("select adm1, sum(area__ha) as area_ha from data where iso='THA' "
                'and umd_tree_cover_density_2000__threshold=0 group by adm1 order by adm1')
GFW = 'https://data-api.globalforestwatch.org/dataset/carbonflux_adm1_summary/v20260327/download/csv?sql='

def targets():
    t = {}
    for tile in ['N10E090', 'N10E100', 'N20E090', 'N20E100', 'N30E090', 'N30E100']:
        for var in ['AGB', 'AGB_SD']:
            name = f'{tile}_ESACCI-BIOMASS-L4-AGB{"_SD" if var == "AGB_SD" else ""}-MERGED-100m-2020-fv7.0.tif'
            t[f'cci/{name}'] = CCI + name
    # 2017 AGB/SD: the median year of Thailand's NFI cycle 3 (FREL 2021), for the forest-type benchmark.
    for tile in ['N10E090', 'N10E100', 'N20E090', 'N20E100', 'N30E090', 'N30E100']:
        for var in ['AGB', 'AGB_SD']:
            name = f'{tile}_ESACCI-BIOMASS-L4-AGB{"_SD" if var == "AGB_SD" else ""}-MERGED-100m-2017-fv7.0.tif'
            t[f'cci2017/{name}'] = CCI.replace('/2020/', '/2017/') + name
    # JAXA FNF 2017, paired with CCI 2017 for the national forest-inventory check (scripts/ingest/nfi_check.py)
    for lon in range(97, 106):
        for lat in range(5, 21):
            name = f'E{lon:03d}.00-N{lat:02d}.00-E{lon+1:03d}.00-N{lat+1:02d}.00-FNF.tiff'
            t[f'fnf2017/{name}'] = f'{FNF.replace("/2020/", "/2017/")}E{lon:03d}.00-E{lon+1:03d}.00/{name}'
    # Copernicus Global Land Service LC100 v3.0.1, 2017 forest-type layer (evergreen / deciduous), CC BY 4.0
    t['cgls/PROBAV_LC100_global_v3.0.1_2017-conso_Forest-Type-layer_EPSG-4326.tif'] = ('https://zenodo.org/records/3518036/files/'
        'PROBAV_LC100_global_v3.0.1_2017-conso_Forest-Type-layer_EPSG-4326.tif?download=1')
    # ESA's own aggregated AGB maps (all years in one file); used to calibrate the error-correlation model.
    for res in ('10000', '25000', '50000'):
        name = f'ESACCI-BIOMASS-L4-AGB-MERGED-{res}m-fv7.0.nc'
        t[f'cci_agg/{name}'] = 'https://dap.ceda.ac.uk/neodc/esacci/biomass/data/agb/maps/v7.0/netcdf/' + name
    for lon in range(97, 106):
        for lat in range(5, 21):
            name = f'E{lon:03d}.00-N{lat:02d}.00-E{lon+1:03d}.00-N{lat+1:02d}.00-FNF.tiff'
            t[f'fnf/{name}'] = f'{FNF}E{lon:03d}.00-E{lon+1:03d}.00/{name}'
    for m in range(1, 13):
        t[f'odiac/odiac2025_1km_excl_intl_24{m:02d}.tif.gz'] = f'{ODIAC}odiac2025_1km_excl_intl_24{m:02d}.tif.gz'
    t['odiac/odiac2025_1km_checksum_2024.md5.txt'] = ODIAC + 'odiac2025_1km_checksum_2024.md5.txt'
    t['gfed/GFED5.1_monthly.zip'] = 'https://zenodo.org/records/16794692/files/GFED5.1_monthly.zip?download=1'
    t['gfed/GFED5.1_ecosystem.zip'] = 'https://zenodo.org/records/16794692/files/GFED5.1_ecosystem.zip?download=1'
    t['codab/tha_admin_boundaries.geojson.zip'] = ('https://data.humdata.org/dataset/d24bdc45-eb4c-4e3d-8b16-44db02667c27/resource/'
                                                  '89a09f13-7b83-458a-9531-4f2418613065/download/tha_admin_boundaries.geojson.zip')
    t['gfw/carbonflux_adm1_tha_tcd30.csv'] = GFW + urllib.parse.quote(GFW_SQL)
    t['gfw/carbonflux_adm1_tha_area.csv'] = GFW + urllib.parse.quote(GFW_AREA_SQL)
    # Climate TRACE v7 forestry-and-land-use subsectors per GADM 4.1 province (THA.1_1 … THA.77_1), 2024.
    for i in range(1, 78):
        t[f'climatetrace/THA.{i}_1-2024.json'] = (f'{CT}?year=2024&gas=co2e_100yr&sectors=forestry-and-land-use&gadmId=THA.{i}_1')
    t['climatetrace/admins-THA.json'] = None  # written by ct_admins(); GADM ids → province names
    return t

CT = 'https://api.climatetrace.org/v7/sources/emissions'

def ct_admins(path):
    out, off = [], 0
    while True:
        page = json.load(urllib.request.urlopen(f'https://api.climatetrace.org/v7/admins?level=1&limit=200&offset={off}', timeout=120))
        out += page
        off += 200
        if len(page) < 200:
            break
    path.write_text(json.dumps(sorted([a for a in out if a['level_0_id'] == 'THA'], key=lambda a: a['id']), ensure_ascii=False, indent=1))

def get(item):
    rel, url = item
    path = RAW / rel
    if path.exists():
        return rel, url, 'present'
    path.parent.mkdir(parents=True, exist_ok=True)
    if url is None:
        ct_admins(path)
        return rel, 'https://api.climatetrace.org/v7/admins?level=1', 'downloaded'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'forest-carbon-thailand-ingest/1'})
        with urllib.request.urlopen(req, timeout=600) as r, open(str(path) + '.part', 'wb') as f:
            while chunk := r.read(1 << 20):
                f.write(chunk)
        os.replace(str(path) + '.part', path)
        return rel, url, 'downloaded'
    except urllib.error.HTTPError as e:
        # JAXA FNF has no tile over open sea; a 404 there is expected, not a gap.
        return rel, url, f'http-{e.code}'

def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        while chunk := f.read(1 << 22):
            h.update(chunk)
    return h.hexdigest()

def main():
    RAW.mkdir(parents=True, exist_ok=True)
    log = json.loads(LOG.read_text()) if LOG.exists() else {}
    with ThreadPoolExecutor(8) as pool:
        for rel, url, status in pool.map(get, targets().items()):
            path = RAW / rel
            entry = {'url': url or 'https://api.climatetrace.org/v7/admins?level=1', 'status': status}
            if path.exists():
                entry.update(bytes=path.stat().st_size, sha256=sha256(path),
                             retrieved=log.get(rel, {}).get('retrieved') or time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))
            log[rel] = entry
            print(status, rel, flush=True)
    LOG.write_text(json.dumps(dict(sorted(log.items())), indent=1) + '\n')
    missing = [k for k, v in log.items() if 'sha256' not in v and not k.startswith(('fnf/', 'fnf2017/'))]
    if missing:
        sys.exit(f'missing required files: {missing}')

if __name__ == '__main__':
    main()
