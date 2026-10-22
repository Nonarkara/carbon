#!/usr/bin/env node
// Checks the built pages: every <table> sits inside exactly one scroll container.
//
// The builders (scripts/build-research.mjs, scripts/build-manual.mjs) wrap the tables that
// marked produces, through scripts/lib/table-wrap.mjs. This script checks the RESULT, so a
// table that reaches the page by another route — a template, a hand-written fragment — is
// caught here instead of shipping as a table that hides its own overflow.
//
// A table wider than its column has to scroll in ONE place. When it scrolls inside itself,
// the columns beyond the edge disappear behind a gesture nothing advertises. That is the
// law's "moving everything into nested scroll areas", and it is what this check prevents.
//
// Run: node scripts/check-table-wrappers.mjs
import { readFileSync, existsSync } from 'node:fs';

const TARGETS = [
  'public/research-th.html',
  'public/research-en.html',
  'public/guide-th.html',
  'public/guide-en.html',
];

let failed = 0;
let checked = 0;

for (const rel of TARGETS) {
  if (!existsSync(rel)) {
    console.log(`skip  ${rel} — not built (run npm run build)`);
    continue;
  }
  const html = readFileSync(rel, 'utf8');
  let unwrapped = 0;
  let tables = 0;
  for (const m of html.matchAll(/<table\b[\s\S]*?<\/table>/g)) {
    tables += 1;
    const before = html.slice(0, m.index);
    if (!/<div class="table-scroll">\s*$/.test(before)) unwrapped += 1;
  }
  checked += 1;
  if (unwrapped > 0) {
    failed += 1;
    console.log(`FAIL  ${rel} — ${unwrapped} of ${tables} tables are not inside a .table-scroll frame`);
  } else {
    console.log(`ok    ${rel} — ${tables} tables, all in a scroll frame`);
  }
}

if (failed) {
  console.error('\nA table without a scroll frame scrolls inside itself. Wrap it in scripts/lib/table-wrap.mjs.');
  process.exit(1);
}
if (checked === 0) {
  console.log('\nnothing built to check — run npm run build first');
} else {
  console.log('\nPASS every table on the built pages has exactly one scroll container');
}
