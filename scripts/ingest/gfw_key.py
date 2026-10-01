"""Create a GFW Data API key and store it in .env (owner step, run once a year).

The password is read with getpass, sent only to data-api.globalforestwatch.org,
and never written anywhere. Only the resulting API key is saved, to .env
(gitignored, mode 600). The key is for the offline ingest; it never ships.
"""
import getpass, json, os, sys, urllib.parse, urllib.request
from pathlib import Path

API = 'https://data-api.globalforestwatch.org'
ENV = Path(__file__).resolve().parents[2] / '.env'


def post(path, body, headers):
    req = urllib.request.Request(API + path, data=body, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f'{path}: HTTP {e.code} {e.read().decode(errors="replace")[:300]}')


# GFW issues keys only to email+password accounts; a Google/Facebook/Twitter login cannot get a token.
email = input('MyGFW email (the email+password account, not a Google login): ').strip()
password = getpass.getpass('MyGFW password (hidden): ')
token = post('/auth/token', urllib.parse.urlencode({'username': email, 'password': password}).encode(),
             {'Content-Type': 'application/x-www-form-urlencoded'})['data']['access_token']
del password

key = post('/auth/apikey', json.dumps({'alias': 'forest-carbon-thailand-ingest', 'email': email,
                                       'organization': 'Forest Carbon Thailand', 'domains': []}).encode(),
           {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})['data']

lines = [l for l in (ENV.read_text().splitlines() if ENV.exists() else []) if not l.startswith('GFW_API_KEY=')]
ENV.write_text('\n'.join(lines + [f'GFW_API_KEY={key["api_key"]}']) + '\n')
os.chmod(ENV, 0o600)
print(f'Saved GFW_API_KEY to {ENV} (…{key["api_key"][-4:]}), expires {key["expires_on"][:10]}.')
