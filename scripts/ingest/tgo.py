"""TGO T-VER forestry & agriculture registry snapshot → public/data/tgo/tver-forestry.json

Usage: .venv/bin/python scripts/ingest/tgo.py
Fetches (skipping files already in research/raw/tgo/) the public T-VER project list, the detail page of every
FOR&AGR project and TGO's reported OTC credit trading by calendar year, then parses them.
No login, no key. The T-VER database states no reuse licence; this is a dated, attributed extract of a public
registry listing that links every record back to TGO. TGO's live pages remain authoritative.

Conservation: per-project issuance records must sum to the list's issued totals; province totals
(single-province projects) + multi-province + unlocated must equal the national totals. Asserted below.
"""
import hashlib, html, json, re, time, urllib.parse, urllib.request, zipfile
from pathlib import Path

RAW = Path('research/raw/tgo')
OUT = Path('public/data/tgo')
OVERRIDES = Path('scripts/ingest/tgo_province_overrides.json')
BASE = 'https://tver.tgo.or.th'
LIST = BASE + '/database/Public/ProjectsResult'
MARKET = 'https://carbonmarket.tgo.or.th/modules/home/ajax_pbi_data_event.php'
UA = {'User-Agent': 'Mozilla/5.0 (forest-carbon-thailand ingest; public data)'}
YEARS_BE = range(2559, 2570)

def fetch(path, url, data=None):
    path = Path(path)
    if path.exists():
        return path.read_bytes()
    body = urllib.parse.urlencode(data).encode() if data else None
    for attempt in range(4):   # TGO hosts reset connections intermittently
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data=body, headers=UA), timeout=120) as r:
                raw = r.read()
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(raw)
            time.sleep(0.3)
            return raw
        except Exception as e:
            if attempt == 3:
                raise
            time.sleep(2 + attempt * 3)

def clean(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()

def num(s):
    s = (s or '').replace(',', '').strip()
    try:
        return float(s)
    except ValueError:
        return None

def be_date(s):
    m = re.match(r'(\d{2})/(\d{2})/(\d{4})', s or '')
    return f'{int(m.group(3)) - 543:04d}-{m.group(2)}-{m.group(1)}' if m else None

def list_rows(prog, grp, lang):
    h = fetch(RAW / f'projects_result_p{prog}_g{grp}_{lang}.html', LIST,
              {'filter_program_id': prog, 'filter_group_id': grp, 'filter_lang': lang, 'filter_category_id': '',
               'filter_size_id': '', 'filter_status_id': ''}).decode('utf-8')
    rows = []
    for r in re.findall(r'<tr class="small">(.*?)</tr>', h, re.S):
        tds = re.findall(r'<td[^>]*>(.*?)</td>', r, re.S)
        link = re.search(r'href="([^"]+)"', r).group(1)
        rows.append({'cells': [clean(t) for t in tds], 'link': link, 'id': int(link.split('/')[-1].split('?')[0])})
    return rows

def detail(prog, grp, iid):
    h = fetch(RAW / f'detail/p{prog}_g{grp}_{iid}_th.html', f'{BASE}/database/public/project/{prog}/{grp}/{iid}?lang=th').decode('utf-8')
    sec = {}
    parts = re.split(r'<h4[^>]*>(.*?)</h4>', h, flags=re.S)
    for k in range(1, len(parts), 2):
        tables = []
        for t in re.findall(r'<table.*?</table>', parts[k + 1].split('<footer')[0], re.S):
            kv = {}
            for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', t, re.S):
                tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S)
                if len(tds) >= 2:
                    kv.setdefault(clean(tds[0]), clean(tds[1]))
            if kv:
                tables.append(kv)
        sec.setdefault(clean(parts[k]), []).extend(tables)
    return sec

# ---------- provinces ----------
def province_names():
    z = zipfile.ZipFile('research/raw/landscape/codab/tha_admin_boundaries.geojson.zip')
    fc = json.loads(z.read('tha_admin1.geojson'))
    return {f['properties']['adm1_name1']: f['properties']['adm1_pcode'] for f in fc['features']}

ALIASES = {'กรุงเทพฯ': 'กรุงเทพมหานคร', 'กทม': 'กรุงเทพมหานคร', 'อยุธยา': 'พระนครศรีอยุธยา'}

def marked_provinces(text, names):
    """Provinces written after จ. / จังหวัด (the address marker) — the only automatic rule used."""
    found = []
    for m in re.finditer(r'(?:จ\.|จังหวัด)\s*([ก-๙ฯ]+)', text):
        word = m.group(1)
        hit = next((n for n in sorted(names, key=len, reverse=True) if word.startswith(n)), None)
        hit = hit or next((p for a, p in ALIASES.items() if word.startswith(a)), None)
        if hit and hit not in found:
            found.append(hit)
    if 'กรุงเทพมหานคร' in text and 'กรุงเทพมหานคร' not in found and re.search(r'แขวง|เขต', text):
        found.append('กรุงเทพมหานคร')
    return found

FAMILIES = [  # methodology lineage per TGO catalogue (e.g. S-METH-13-01 ⇐ METH-FOR-01)
    (r'S-METH-13-01|METH-FOR-01|TVER-METH-13-01|P-METH-13-01', 'ar'),
    (r'S-METH-13-02|METH-FOR-02|P-METH-13-03', 'redd'),
    (r'S-METH-13-03|METH-FOR-03', 'ar_large'),
    (r'S-METH-13-04|METH-FOR-04|TVER-METH-13-04', 'plantation'),
    (r'P-METH-13-02|P-METH-13-04', 'mangrove'),
    (r'P-METH-13-05', 'ifm'),
    (r'S-METH-13-05|METH-AGR-01|P-METH-13-06|P-METH-13-08', 'agri_land'),
    (r'S-METH-13-06|METH-AGR-02', 'perennial'),
    (r'13-07|P-METH-13-09', 'peat'),
]

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    names = province_names()
    overrides = json.loads(OVERRIDES.read_text(encoding='utf-8'))
    projects, list_issued = [], 0.0
    for prog in (1, 2):
        for grp in (1, 2):
            th, en = list_rows(prog, grp, 'th'), {r['id']: r for r in list_rows(prog, grp, 'en')}
            for r in th:
                c = r['cells']
                if '[FOR&AGR]' not in c[5]:
                    continue
                d = detail(prog, grp, r['id'])
                P, R, C, I = 'ข้อมูลโครงการ', 'ข้อมูลการขึ้นทะเบียนโครงการ', 'ข้อมูลการขึ้นทะเบียนกลุ่มโครงการย่อย (CPA)', 'ข้อมูลการรับรองคาร์บอนเครดิต'
                pinfo = {k: v for t in d.get(P, []) for k, v in t.items()}
                rinfo = {k: v for t in d.get(R, []) for k, v in t.items()}
                cpas = d.get(C, [])
                meth = pinfo.get('ระเบียนวิธี', '')
                allmeth = ' | '.join([meth] + [t.get('ระเบียบวิธี', '') for t in cpas])
                fams = sorted({f for pat, f in FAMILIES if re.search(pat, allmeth)})
                issuances = []
                for t in d.get(I, []):
                    amount = num(next((v for k, v in t.items() if k.startswith('ปริมาณก๊าซเรือนกระจกที่ขอรับรอง')), ''))
                    issuances.append({'n': int(num(t.get('ครั้งที่')) or 0), 'certified': be_date(t.get('วันที่ได้รับการรับรอง')),
                                      'start': be_date(t.get('วันที่เริ่มคิดเครดิต')), 'end': be_date(t.get('วันที่สิ้นสุดการคิดเครดิต')),
                                      'tco2e': amount})
                issued = num(c[8]) or 0.0
                list_issued += issued
                key = f'{prog}/{grp}/{r["id"]}'
                loc = ' ; '.join([c[4]] + [t.get('ที่ตั้งโครงการ', '') for t in cpas])
                if key in overrides:
                    provs, basis = overrides[key]['provinces'], 'reviewed'
                else:
                    provs = marked_provinces(loc + ' ; ' + c[2], names)
                    basis = 'address-marker' if provs else 'unlocated'
                assert all(p in names for p in provs), (key, provs)
                projects.append({
                    'key': key, 'program': {1: 'standard', 2: 'premium'}[prog], 'form': {1: 'project', 2: 'poa'}[grp],
                    'reg': c[1], 'name_th': c[2], 'name_en': en[r['id']]['cells'][2] if r['id'] in en else None,
                    'developer': c[3], 'location_th': c[4], 'provinces': [names[p] for p in provs], 'province_basis': basis, 'province_note': overrides.get(key, {}).get('reason'),
                    'methodology': meth or None, 'families': fams, 'size': pinfo.get('ขนาดโครงการ') or None,
                    'status': c[9], 'status_en': en[r['id']]['cells'][9] if r['id'] in en else None,
                    'registered': be_date(rinfo.get('วันที่ขึ้นทะเบียน')),
                    'credit_start': be_date(rinfo.get('วันที่เริ่มคิดเครดิต') or rinfo.get('วันที่เริ่มต้นกรอบแผนงาน')),
                    'credit_end': be_date(rinfo.get('วันที่สิ้นสุดการคิดเครดิต') or rinfo.get('วันที่สิ้นสุดกรอบแผนงาน')),
                    'expected_tco2e_yr': num(c[6]), 'issued_tco2e': issued, 'issuances': issuances, 'cpas': len(cpas),
                    'url': f'{BASE}/database/public/project/{prog}/{grp}/{r["id"]}?lang=th',
                })
                recs = sum(i['tco2e'] or 0 for i in issuances)
                assert abs(recs - issued) < 1e-6, f'issuance records {recs} != list total {issued} for {key}'

    # ---------- province aggregation with explicit remainder ----------
    pcodes = sorted(names.values())
    prov = {p: {'projects': 0, 'expected_tco2e_yr': 0.0, 'issued_tco2e': 0.0, 'multi_province_projects': 0} for p in pcodes}
    rest = {'multi': {'projects': 0, 'expected_tco2e_yr': 0.0, 'issued_tco2e': 0.0},
            'unlocated': {'projects': 0, 'expected_tco2e_yr': 0.0, 'issued_tco2e': 0.0}}
    for p in projects:
        tgt = prov[p['provinces'][0]] if len(p['provinces']) == 1 else rest['multi' if p['provinces'] else 'unlocated']
        tgt['projects'] += 1
        tgt['expected_tco2e_yr'] += p['expected_tco2e_yr'] or 0
        tgt['issued_tco2e'] += p['issued_tco2e']
        if len(p['provinces']) > 1:
            for pc in p['provinces']:
                prov[pc]['multi_province_projects'] += 1
    national = {'projects': len(projects), 'expected_tco2e_yr': sum(p['expected_tco2e_yr'] or 0 for p in projects),
                'issued_tco2e': sum(p['issued_tco2e'] for p in projects),
                'projects_with_issuance': sum(1 for p in projects if p['issued_tco2e'] > 0)}
    for k in ('projects', 'expected_tco2e_yr', 'issued_tco2e'):
        total = sum(v[k] for v in prov.values()) + rest['multi'][k] + rest['unlocated'][k]
        assert abs(total - national[k]) < 1e-6, (k, total, national[k])
    assert abs(national['issued_tco2e'] - list_issued) < 1e-6

    # ---------- reported OTC trading (TGO carbon market portal) ----------
    market = {}
    for label, mt in (('for_agr', '["_MAINTYPE14"]'), ('all', '["_ALL"]')):
        rows = []
        for y in YEARS_BE:
            raw = fetch(RAW / f'market/{label}_{y}.json', MARKET, {
                'pbi_calendar': '_CALENDARYEAR', 'pbi_type': '_YEARLY', 'pbi_action': '', 'pbi_category': str(y), 'pbi_point': '',
                'pbi_market_type': '["_ALL"]', 'pbi_main_type': mt, 'pbi_mitigation_activity': '["_ALL"]',
                'pbi_methodology': '["_ALL"]', 'pbi_sub_activity': '["_ALL"]'})
            d = json.loads(raw.decode('utf-8'))
            vol, val = num(d.get('volume')), num(d.get('value'))
            if vol:
                rows.append({'year': y - 543, 'transactions': int(num(d.get('transaction')) or 0), 'volume_tco2e': vol, 'value_thb': val,
                             'avg_thb': num(d.get('average')), 'min_thb': num(d.get('price_min')), 'max_thb': num(d.get('price_max'))})
        market[label] = rows

    files = sorted(p for p in RAW.rglob('*') if p.is_file())
    digest = hashlib.sha256()
    for f in files:
        digest.update(f.name.encode() + hashlib.sha256(f.read_bytes()).digest())
    out = {
        'schemaVersion': 1,
        'snapshot': time.strftime('%Y-%m-%d', time.localtime(max(f.stat().st_mtime for f in files))),
        'source': {'registry': BASE + '/database/public/projects/1/1', 'list_endpoint': LIST, 'market': 'https://carbonmarket.tgo.or.th',
                   'publisher': 'Thailand Greenhouse Gas Management Organization (Public Organization), TGO',
                   'terms': 'Public registry listing; no reuse licence stated on the T-VER database. Dated extract with attribution; each record links to TGO, whose live pages are authoritative.',
                   'raw_files': len(files), 'raw_sha256': digest.hexdigest(), 'pipeline_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
        'scope': 'T-VER projects in sector FOR&AGR (forestry and agriculture), Standard and Premium, single/bundled and PoA',
        'definitions': {
            'expected_tco2e_yr': 'Expected reduction/removal per year stated at registration (ex-ante), not achieved',
            'issued_tco2e': 'Credits certified by TGO so far (cumulative issuance). Transfers and retirements are not public by project',
            'provinces': 'Province(s) named in TGO location text: automatic only after จ./จังหวัด; other cases reviewed by hand (scripts/ingest/tgo_province_overrides.json). Not coordinates.',
            'market': 'OTC trades reported to TGO, by calendar year; the current year is year-to-date at snapshot',
        },
        'national': national, 'provinces': prov, 'multi': rest['multi'], 'unlocated': rest['unlocated'],
        'market': market, 'projects': projects,
    }
    (OUT / 'tver-forestry.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    by = {}
    for p in projects:
        by[p['province_basis']] = by.get(p['province_basis'], 0) + 1
    print(national, rest, by, len(market['for_agr']), 'market years')

if __name__ == '__main__':
    main()
