"""Cook GFW's yearly tree cover loss into per-province series: public/data/gfw/loss-years.json.

Usage: .venv/bin/python scripts/ingest/build_loss.py   (after fetch.py)

Raw: two GFW carbonflux_adm1_change v20260327 extracts (tcd30, flux-model extent, 2001–2025).
Cooked, per province and nationally, one value per year:
  loss_ha            all tree cover lost
  plantation_ha      of which inside GFW's plantation map (rubber, oil palm, wood fibre, other tree crops)
  natural_ha         of which outside it: the loss that is closest to deforestation
  primary_ha         natural loss inside UMD regional primary forest (2001)
  protected_ha       natural loss inside a WDPA protected area
  emissions          gross CO2e from that loss (biomass + soil), all; natural_emissions likewise
  drivers            natural loss split by the WRI/Google dominant-driver classes

  tree_cover_*_ha    tree cover in 2000, outside and inside the plantation map: the rate's denominator

Also writes public/data/gfw/loss-years.csv: one row per province-year, each carrying its source.

Conservation, asserted here and tested in tests/loss.test.mjs:
  natural + plantation = loss in every province-year (one extract)
  the two extracts agree on loss and emissions in every province-year
  provinces sum to the national series
  25-year emissions equal the summary extract the ledger already ships
"""
import csv, io, json
from collections import defaultdict
from pathlib import Path

RAW = Path('research/raw/landscape/gfw')
OUT = Path('public/data/gfw/loss-years.json')
CSV_OUT = OUT.with_suffix('.csv')
YEARS = list(range(2001, 2026))
NA = 'Not applicable'   # GFW's plantation type outside its plantation map

def zero():
    return {k: [0.0] * len(YEARS) for k in ('loss_ha', 'plantation_ha', 'natural_ha', 'primary_ha', 'protected_ha',
                                             'emissions', 'natural_emissions')}

def main():
    gadm = {}
    led = json.loads(Path('public/data/ledger/provinces.json').read_text())
    for p in led['provinces']:
        gadm[p['gadm'].split('.')[1].split('_')[0]] = p['pcode']
    assert len(gadm) == 77

    rows = defaultdict(zero)
    drivers = defaultdict(lambda: defaultdict(lambda: [0.0] * len(YEARS)))
    for r in csv.DictReader(open(RAW / 'loss_adm1_tha_drivers.csv')):
        y = int(r['year'])
        if y not in YEARS:
            continue
        i, pc, ha, em = YEARS.index(y), gadm[r['adm1']], float(r['loss_ha']), float(r['emissions_mg_co2e'] or 0)
        s = rows[pc]
        s['loss_ha'][i] += ha
        s['emissions'][i] += em
        if r['plantation'] == NA:
            s['natural_ha'][i] += ha
            s['natural_emissions'][i] += em
            drivers[pc][r['driver'] or 'Unknown'][i] += ha
        else:
            s['plantation_ha'][i] += ha

    check = defaultdict(lambda: {'loss_ha': [0.0] * len(YEARS), 'emissions': [0.0] * len(YEARS)})
    for r in csv.DictReader(open(RAW / 'loss_adm1_tha_places.csv')):
        y = int(r['year'])
        if y not in YEARS:
            continue
        i, pc, ha = YEARS.index(y), gadm[r['adm1']], float(r['loss_ha'])
        check[pc]['loss_ha'][i] += ha
        check[pc]['emissions'][i] += float(r['emissions_mg_co2e'] or 0)
        if r['plantation'] == NA:
            if r['primary_forest'] == 'True':
                rows[pc]['primary_ha'][i] += ha
            if r['wdpa']:
                rows[pc]['protected_ha'][i] += ha

    for pc, s in rows.items():
        for k in ('loss_ha', 'emissions'):
            for a, b in zip(s[k], check[pc][k]):
                assert abs(a - b) <= 1e-6 * max(1, a), (pc, k, a, b)
        for i in range(len(YEARS)):
            assert abs(s['natural_ha'][i] + s['plantation_ha'][i] - s['loss_ha'][i]) <= 1e-6 * max(1, s['loss_ha'][i])
            assert s['primary_ha'][i] <= s['natural_ha'][i] + 1e-6 and s['protected_ha'][i] <= s['natural_ha'][i] + 1e-6

    # The 25-year emissions must equal what the ledger already ships from the summary extract.
    for p in led['provinces']:
        total = sum(rows[p['pcode']]['emissions'])
        assert abs(total - p['gfw_emissions_mg_co2e']) <= 0.005 * max(1, p['gfw_emissions_mg_co2e']) + 1, (p['pcode'], total, p['gfw_emissions_mg_co2e'])

    # Tree cover in 2000, split as the loss is. The two halves must rebuild the extent the ledger ships.
    cover = defaultdict(lambda: {'tree_cover_natural_ha': 0.0, 'tree_cover_plantation_ha': 0.0})
    for r in csv.DictReader(open(RAW / 'tree_cover_adm1_tha_2000.csv')):
        cover[gadm[r['adm1']]]['tree_cover_natural_ha' if r['plantation'] == NA else 'tree_cover_plantation_ha'] += float(r['extent_ha'])
    for p in led['provinces']:
        total = sum(cover[p['pcode']].values())
        assert abs(total - p['gfw_extent_ha']) <= 0.005 * p['gfw_extent_ha'] + 1, (p['pcode'], total, p['gfw_extent_ha'])

    nat, nat_drv = zero(), defaultdict(lambda: [0.0] * len(YEARS))
    for pc, s in rows.items():
        for k, v in s.items():
            nat[k] = [a + b for a, b in zip(nat[k], v)]
        for d, v in drivers[pc].items():
            nat_drv[d] = [a + b for a, b in zip(nat_drv[d], v)]

    nat_cover = {k: sum(c[k] for c in cover.values()) for k in ('tree_cover_natural_ha', 'tree_cover_plantation_ha')}

    def cook(s, drv, tc):
        return {**{k: round(v, 1) for k, v in tc.items()}, **{k: [round(x, 1) for x in v] for k, v in s.items()},
                'drivers': {d: [round(x, 1) for x in v] for d, v in sorted(drv.items(), key=lambda kv: -sum(kv[1]))}}

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        'meta': {'dataset': 'GFW carbonflux_adm1_change', 'version': 'v20260327 (flux model v1.4.3)', 'licence': 'CC BY 4.0',
                 'years': YEARS, 'filters': 'tree cover density 2000 ≥ 30%, GFW flux-model extent',
                 'units': {'*_ha': 'hectares per year', 'emissions': 'Mg (t) CO2e per year, biomass + soil, all gases'},
                 'natural': 'outside GFW plantation map (gfw_plantation_flux_model__type = Not applicable)',
                 'primary': 'UMD regional primary forest 2001', 'protected': 'WDPA, any IUCN category',
                 'tree_cover': 'UMD tree cover 2000 (density ≥ 30%), flux-model extent; denominator of the loss rate',
                 'drivers': 'WRI/Google dominant driver of loss 2001–2024 (one class per 1 km cell), natural loss only',
                 'raw': ['research/raw/landscape/gfw/loss_adm1_tha_drivers.csv', 'research/raw/landscape/gfw/loss_adm1_tha_places.csv'],
                 'caveat': 'Tree cover loss is not deforestation: plantations are harvested and replanted, and the loss map does not record regrowth.'},
        'national': cook(nat, nat_drv, nat_cover),
        'provinces': {pc: cook(rows[pc], drivers[pc], cover[pc]) for pc in sorted(rows)},
    }, ensure_ascii=False, separators=(',', ':')) + '\n')

    # The same rounded numbers as the JSON, so the two downloads can never disagree.
    data = json.loads(OUT.read_text())
    names = {p['pcode']: (p['name_en'], p['name_th']) for p in led['provinces']} | {'TH': ('Thailand', 'ประเทศไทย')}
    driver_names = list(data['national']['drivers'])
    buf = io.StringIO(newline='')
    w = csv.writer(buf)
    w.writerow(['pcode', 'province_en', 'province_th', 'year', 'tree_cover_lost_ha', 'outside_plantations_ha', 'inside_plantations_ha',
                'outside_in_primary_forest_ha', 'outside_in_protected_areas_ha', 'emissions_tco2e', 'emissions_outside_plantations_tco2e',
                *[f'outside_driver_{d}_ha' for d in driver_names], 'source'])
    source = f"{data['meta']['dataset']} {data['meta']['version']}; {data['meta']['filters']}; CC BY 4.0; tree cover loss is not deforestation"
    for pc, s in [('TH', data['national']), *data['provinces'].items()]:
        for i, y in enumerate(YEARS):
            w.writerow([pc, *names[pc], y, s['loss_ha'][i], s['natural_ha'][i], s['plantation_ha'][i], s['primary_ha'][i], s['protected_ha'][i],
                        s['emissions'][i], s['natural_emissions'][i], *[s['drivers'].get(d, [0.0] * 25)[i] for d in driver_names], source])
    CSV_OUT.write_text('\ufeff' + buf.getvalue(), encoding='utf-8')
    print(f'{OUT}: {len(rows)} provinces, natural {sum(nat["natural_ha"]):,.0f} ha, plantation {sum(nat["plantation_ha"]):,.0f} ha, '
          f'primary {sum(nat["primary_ha"]):,.0f} ha, protected {sum(nat["protected_ha"]):,.0f} ha')

if __name__ == '__main__':
    main()
