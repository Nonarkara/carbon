"""Sanitize data.go.th CKAN catalogue snapshots, and optionally re-fetch them.

Source: Government of Thailand open data catalogue, https://data.go.th/
The committed pages are the 25 September 2026 CKAN `package_search` responses
for the keyword ป่าไม้. Exact request URLs are in
research/extracted/data-go-th-sources.json.

Personal contact fields are not written to the repository. `author_email`,
`maintainer_email` and `telephone_number` are cleared, and any other email
address in the JSON is replaced with [redacted]. Original acquisition hashes
in evidence-checks.json stay as recorded; this script updates only the public
hashes of the sanitized files.

Usage:
  python3 scripts/ingest/data_go_th_catalogue.py --sanitize
  python3 scripts/ingest/data_go_th_catalogue.py --fetch
"""
import hashlib
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'research' / 'raw'
EXTRACTED = ROOT / 'research' / 'extracted'
EVIDENCE = EXTRACTED / 'evidence-checks.json'
KEYWORD = 'ป่าไม้'
API = 'https://data.go.th/api/3/action/package_search'
SORTED_STARTS = (0, 100, 200, 300, 400, 500)
CONTACT_KEYS = {
    'author_email',
    'maintainer_email',
    'telephone_number',
    'maintainer_phone',
    'contact_email',
    'email',
    'phone',
    'fax',
    'mobile',
}
EMAIL = re.compile(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}')


def search_url(start, sort_by_id):
    query = {'q': KEYWORD, 'rows': 100, 'start': start}
    if sort_by_id:
        query['sort'] = 'id asc'
    return API + '?' + urllib.parse.urlencode(query)


def catalogue_files():
    files = [RAW / 'data-go-th-search-000.json']
    files.extend(RAW / f'data-go-th-sorted-{start:03d}.json' for start in SORTED_STARTS)
    files.append(EXTRACTED / 'catalog.json')
    return files


def sanitize(value):
    """Remove contact fields and email addresses. Returns the number of edits."""
    edits = 0
    if isinstance(value, dict):
        for key, item in list(value.items()):
            if key.casefold() in CONTACT_KEYS and isinstance(item, str):
                if item:
                    edits += 1
                value[key] = ''
            else:
                edits += sanitize(item)
                if isinstance(value[key], str):
                    redacted = EMAIL.sub('[redacted]', value[key])
                    if redacted != value[key]:
                        edits += 1
                        value[key] = redacted
    elif isinstance(value, list):
        for index, item in enumerate(value):
            edits += sanitize(item)
            if isinstance(value[index], str):
                redacted = EMAIL.sub('[redacted]', value[index])
                if redacted != value[index]:
                    edits += 1
                    value[index] = redacted
    return edits


def dump_json(path, data):
    text = path.read_text(encoding='utf-8')
    if '\n' in text:
        rendered = json.dumps(data, ensure_ascii=False, indent=2)
    else:
        rendered = json.dumps(data, ensure_ascii=True, separators=(', ', ': '))
    if not text.endswith('\n'):
        path.write_text(rendered, encoding='utf-8')
    else:
        path.write_text(rendered + '\n', encoding='utf-8')


def load_preserving_format(path):
    text = path.read_text(encoding='utf-8')
    data = json.loads(text)
    if '\n' in text:
        rendered = json.dumps(data, ensure_ascii=False, indent=2)
    else:
        rendered = json.dumps(data, ensure_ascii=True, separators=(', ', ': '))
    if rendered != text.rstrip('\n'):
        raise SystemExit(f'refusing to rewrite {path}: JSON formatting would change unrelated bytes')
    return data


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def update_evidence():
    evidence = load_preserving_format(EVIDENCE)
    by_path = {row['path']: row for row in evidence['raw_files']}
    for path in catalogue_files():
        if path.name == 'catalog.json':
            continue
        rel = path.relative_to(ROOT).as_posix()
        row = by_path[rel]
        row['public_sha256'] = sha256(path)
        row['public_bytes'] = path.stat().st_size
        row['sanitized'] = True
        row['contacts_removed'] = True
    evidence['redaction_note'] = (
        'Before public release, upstream token patterns and API-key query values in catalogue '
        'metadata were removed. Maintainer email addresses, author emails and telephone numbers '
        'from data.go.th are also omitted; data.go.th remains the credited source '
        '(see research/extracted/data-go-th-sources.json). Original pre-redaction hashes are '
        'retained for provenance; public-file hashes describe the sanitized files.'
    )
    dump_json(EVIDENCE, evidence)


def sanitize_committed():
    total = 0
    for path in catalogue_files():
        data = load_preserving_format(path)
        edits = sanitize(data)
        dump_json(path, data)
        # A second pass must be a no-op, including formatting.
        again = load_preserving_format(path)
        if sanitize(again):
            raise SystemExit(f'sanitize was not idempotent for {path}')
        dump_json(path, again)
        total += edits
        print(f'{path.relative_to(ROOT)} edits={edits} bytes={path.stat().st_size}')
    update_evidence()
    print(f'sanitized {total} contact values')


def fetch_pages():
    """Download the catalogue pages and write only the sanitized JSON."""
    jobs = [(RAW / 'data-go-th-search-000.json', search_url(0, False))]
    jobs.extend(
        (RAW / f'data-go-th-sorted-{start:03d}.json', search_url(start, True))
        for start in SORTED_STARTS
    )
    for path, url in jobs:
        print(f'fetch {url}')
        with urllib.request.urlopen(url, timeout=60) as response:
            payload = response.read()
        data = json.loads(payload.decode('utf-8'))
        sanitize(data)
        rendered = json.dumps(data, ensure_ascii=True, separators=(', ', ': '))
        path.write_text(rendered, encoding='utf-8')
    print('fetched sanitized catalogue pages; re-run --sanitize to refresh public hashes')


def main(argv):
    if argv == ['--sanitize']:
        sanitize_committed()
    elif argv == ['--fetch']:
        fetch_pages()
    else:
        raise SystemExit('usage: data_go_th_catalogue.py --sanitize | --fetch')


if __name__ == '__main__':
    main(sys.argv[1:])
