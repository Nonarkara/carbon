import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const EMAIL = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/;
const CONTACT_KEYS = new Set([
  'author_email', 'maintainer_email', 'telephone_number', 'maintainer_phone',
  'contact_email', 'email', 'phone', 'fax', 'mobile',
]);
const RAW_PAGES = [
  'research/raw/data-go-th-search-000.json',
  'research/raw/data-go-th-sorted-000.json',
  'research/raw/data-go-th-sorted-100.json',
  'research/raw/data-go-th-sorted-200.json',
  'research/raw/data-go-th-sorted-300.json',
  'research/raw/data-go-th-sorted-400.json',
  'research/raw/data-go-th-sorted-500.json',
  'research/extracted/catalog.json',
];

function walk(value, file, problems) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, file, problems);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (CONTACT_KEYS.has(key.toLowerCase())) {
      if (item !== '' && item != null) problems.push(`${file} still has a contact value in ${key}`);
    } else if (typeof item === 'string') {
      if (EMAIL.test(item)) problems.push(`${file} still has an email address in ${key}`);
    } else {
      walk(item, file, problems);
    }
  }
}

test('data.go.th catalogue snapshots omit personal contact fields', () => {
  const problems = [];
  for (const file of RAW_PAGES) {
    walk(JSON.parse(readFileSync(file, 'utf8')), file, problems);
  }
  assert.deepEqual(problems, []);
});

test('sanitized catalogue pages match the public hashes and credit data.go.th', () => {
  const evidence = JSON.parse(readFileSync('research/extracted/evidence-checks.json', 'utf8'));
  const sources = JSON.parse(readFileSync('research/extracted/data-go-th-sources.json', 'utf8'));
  assert.match(sources.portal, /^https:\/\/data\.go\.th\/$/);
  assert.equal(sources.pages.length, 7);
  const byFile = new Map(sources.pages.map(page => [page.file, page.url]));
  for (const file of RAW_PAGES.filter(path => path.startsWith('research/raw/'))) {
    const row = evidence.raw_files.find(item => item.path === file);
    const bytes = readFileSync(file);
    const hash = createHash('sha256').update(bytes).digest('hex');
    assert.equal(hash, row.public_sha256, file);
    assert.equal(bytes.length, row.public_bytes, file);
    assert.equal(row.contacts_removed, true, file);
    assert.notEqual(row.sha256, row.public_sha256);
    assert.match(byFile.get(file), /^https:\/\/data\.go\.th\/api\/3\/action\/package_search\?/);
  }
  assert.match(evidence.redaction_note, /data\.go\.th/);
});
