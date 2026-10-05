"""Fetch a dated Thailand forest-alert snapshot. No key, no user geometry, no ledger rewrites.
Usage: python3 scripts/ingest/gfw_watch.py --date 2026-10-05
"""
import argparse, csv, datetime as dt, hashlib, io, json, urllib.parse, urllib.request
from pathlib import Path

API = 'https://data-api.globalforestwatch.org/dataset/'
DATASET = 'gadm__integrated_alerts__adm1_daily_alerts'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--date', required=True, help='Pinned dataset date, YYYY-MM-DD')
    end = dt.date.fromisoformat(parser.parse_args().date)
    start = end - dt.timedelta(days=30)
    version = 'v' + end.strftime('%Y%m%d')
    sql = ("select adm1, gfw_integrated_alerts__date as date, gfw_integrated_alerts__confidence as confidence, "
           "sum(alert__count) as pixels, sum(alert_area__ha) as area_ha from data where iso='THA' "
           f"and is__tree_cover_2022=true and gfw_integrated_alerts__date >= '{start}' "
           f"and gfw_integrated_alerts__date < '{end}' "
           "group by adm1, gfw_integrated_alerts__date, gfw_integrated_alerts__confidence order by adm1, date, confidence")
    url = API + DATASET + '/' + version + '/download/csv?sql=' + urllib.parse.quote(sql)
    req = urllib.request.Request(url, headers={'User-Agent': 'Kabonna-GFW-ingest/1'})
    with urllib.request.urlopen(req, timeout=180) as response:
        raw = response.read()
        probe = {'status': response.status, 'cors': response.headers.get('Access-Control-Allow-Origin'),
                 'rateLimit': response.headers.get('X-RateLimit-Limit')}
    rows = list(csv.DictReader(io.StringIO(raw.decode())))
    assert rows, 'Empty response: do not replace existing snapshot'
    provinces = json.loads(Path('public/data/ledger/provinces.json').read_text())['provinces']
    crosswalk = {int(p['gadm'].split('.')[1].split('_')[0]): p for p in provinces}
    assert len(crosswalk) == 77
    dates = [(start + dt.timedelta(days=i)).isoformat() for i in range(30)]
    levels = ('nominal', 'high', 'highest')
    def empty():
        return {'area_ha': dict.fromkeys(levels, 0), 'pixels': dict.fromkeys(levels, 0), 'daily_ha': [0.0]*30}
    records = {p['pcode']: empty() for p in provinces}
    national = empty()
    for row in rows:
        assert int(row['adm1']) in crosswalk
        level, date = row['confidence'], row['date']
        assert level in levels and date in dates, row
        area, pixels = float(row['area_ha']), int(row['pixels'])
        assert area >= 0 and pixels >= 0
        record = records[crosswalk[int(row['adm1'])]['pcode']]
        for result in (record, national):
            result['area_ha'][level] += area
            result['pixels'][level] += pixels
            result['daily_ha'][dates.index(date)] += area
    # An independent country aggregation detects dropped/duplicated province rows.
    where = sql.split('from data',1)[1].split('group by',1)[0]
    country_sql = ('select gfw_integrated_alerts__confidence as confidence, sum(alert__count) as pixels, '
                   'sum(alert_area__ha) as area_ha from data' + where + 'group by gfw_integrated_alerts__confidence order by confidence')
    country_url = API + DATASET + '/' + version + '/download/csv?sql=' + urllib.parse.quote(country_sql)
    with urllib.request.urlopen(country_url, timeout=180) as response:
        country_raw = response.read()
    country = list(csv.DictReader(io.StringIO(country_raw.decode())))
    for level in levels:
        row = next((r for r in country if r['confidence'] == level), {'area_ha': 0, 'pixels': 0})
        assert abs(float(row['area_ha']) - national['area_ha'][level]) < 1e-6
        assert int(row['pixels']) == national['pixels'][level]
    retrieved = dt.datetime.now(dt.timezone.utc).isoformat()
    rawdir = Path('research/raw/landscape/gfw-watch'); rawdir.mkdir(parents=True, exist_ok=True)
    (rawdir/f'{version}.csv').write_bytes(raw)
    (rawdir/f'{version}-country.csv').write_bytes(country_raw)
    metadata = json.load(urllib.request.urlopen(API+'gfw_integrated_alerts', timeout=60))
    assert '4.0' in metadata['data']['metadata']['license']
    result = {'schemaVersion': 1, 'dataset': DATASET, 'version': version, 'retrievedAt': retrieved,
              'window': {'start': str(start), 'endExclusive': str(end), 'days': 30}, 'dates': dates,
              'mask': 'is__tree_cover_2022=true', 'unit': 'ha', 'confidenceLevels': list(levels),
              'source': url, 'portal': 'https://data.globalforestwatch.org/',
              'metadata': API+'gfw_integrated_alerts', 'licence': 'CC BY 4.0',
              'attribution': 'Integrated Deforestation Alerts — UMD/GLAD and WUR, accessed through GFW / Global Nature Watch',
              'rawSha256': hashlib.sha256(raw).hexdigest(), 'probe': probe,
              'countryCheck': {'source': country_url, 'rawSha256': hashlib.sha256(country_raw).hexdigest(), 'result': 'Province sums match independent country query at each confidence level'},
              'lastAlertDate': max(r['date'] for r in rows), 'national': national, 'provinces': records,
              'limitations': ['Snapshot, not live; alert date is not guaranteed event date.',
                'Legacy integrated deforestation-alert summary, not the newer global DIST-ALERT layer.',
                'Alerts are provisional; cloud cover, sensor coverage and confidence upgrades affect detection.',
                'Zero means no recorded alert in this masked query, not proof of no disturbance.',
                'Province context only; no parcel allocation, carbon conversion or credit deduction.']}
    (rawdir/f'{version}-metadata.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2))
    (rawdir/f'{version}-request.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
    out = Path('public/data/gfw'); out.mkdir(parents=True, exist_ok=True)
    (out/'watch.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'))+'\n')
    print(version, len(rows), 'source rows;', round(sum(national['area_ha'].values()), 2), 'ha recorded alerts')

if __name__ == '__main__':
    main()
