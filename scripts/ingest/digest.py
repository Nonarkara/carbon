"""Non's Digest — dated, attributed snapshot of voluntary carbon market and Thailand TGO news.

Usage: .venv/bin/python scripts/ingest/digest.py

The snapshot is curated by hand from public sources (TGO, ICVCM, World Bank, Kasikorn, Sylvera,
Ara Partners, IDE-JETRO, Regreener, DCCE Hub, VCM.fyi). Each item carries a published date and
a primary source URL. This script enforces the snapshot shape and refreshes SHA-256 hashes.

No live news scraping from the browser — the dashboard reads a dated static file so it never breaks
when an upstream goes down.
"""
import hashlib
import json
from pathlib import Path

DIGEST = Path('public/data/digest/vcm-news.json')

# Minimum data each item must carry. The dashboard and tests depend on these keys.
def _check_items(items):
    required={'id','date','source','url','title_en','title_th','summary_en','summary_th'}
    for it in items:
        missing=required-set(it.keys())
        assert not missing, f'item {it.get("id","?")} missing keys: {missing}'
        assert it['url'].startswith('http'), f"item {it['id']} url must be http(s)"
        assert len(it['date'])==10 and it['date'][4]=='-', f"item {it['id']} date must be YYYY-MM-DD"
def _check_trends(trends):
    for t in trends:
        for k in ('id','label_en','label_th','direction','series'):
            assert k in t, f'trend {t.get("id","?")} missing key {k}'
        for p in t['series']:
            assert {'label','date','value','unit'}<=set(p.keys()), f'trend {t["id"]} series point {p} missing keys'
            assert t['direction'] in ('up','down','flat'), f'trend {t["id"]} direction must be up/down/flat'

def main():
    d=json.loads(DIGEST.read_text(encoding='utf-8'))
    assert d['schemaVersion']==1
    assert d['purpose'].startswith("Non's Digest")
    _check_items(d['items'])
    _check_trends(d['trends'])
    # Refresh hashes — items + trends payload is the raw material; pipeline hash covers the script.
    payload={'items':d['items'],'trends':d['trends']}
    d['raw_sha256']=hashlib.sha256(json.dumps(payload,sort_keys=True,separators=(',',':')).encode('utf-8')).hexdigest()
    d['pipeline_sha256']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    DIGEST.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'items={len(d["items"])} trends={len(d["trends"])} snapshot={d["snapshot"]} '
          f'raw={d["raw_sha256"][:16]} pipeline={d["pipeline_sha256"][:16]}')

if __name__=='__main__':
    main()