#!/usr/bin/env node
// The capability matrix, measured.
//
// This product publishes what it can do. The Bible says how many chapters it holds, the guide
// says the same number, the About page says how many provinces and how many T-VER records it
// carries, the research notebook says how many chapters it has, and the readiness document
// states the same figures in prose. Those numbers are the reader's only handle on the tool:
// if the site says 68 chapters and the site holds 65, the product is not slightly wrong, it is
// lying about its own capability.
//
// Nothing checked them. The published numbers were written by hand at whatever moment a
// feature landed, and they drifted: the readiness document still said 65 chapters and 80
// source entries while the shipped Bible held 68 and 87. A reader comparing the document with
// the product would find two different answers and no way to tell which one is the tool.
//
// So this gate reads the truth out of the shipped data and the claim out of the shipped page
// or the shipped document, and insists they are the same number. It is deliberately written
// against the DATA rather than against a literal: add a chapter, rebuild, and the guide still
// says 68 and the Bible still holds 69 — this gate then fails and names the page that must be
// updated, which is the point. A gate that hardcoded 68 would have kept passing while the
// product grew underneath it.
//
// Every claim here is one a reader can actually see. A claim that stops being published is
// itself a failure: the gate says so, rather than quietly dropping the check and reporting a
// clean run.
//
//   node scripts/capability-claims.mjs
//
// Writes test-results/capability/claims.json — the matrix, in the machine's own words.
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';
import {designDiagramIds} from '../public/js/bible-design-diagrams.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = async rel => readFile(resolve(ROOT, rel), 'utf8');
const json = async rel => JSON.parse(await read(rel));

const bible = await json('public/data/bible.json');
const sea = await json('public/data/sea/snapshot.json');
const tgo = await json('public/data/tgo/tver-forestry.json');
const ledger = await json('public/data/ledger/provinces.json');
const provinceYears = await json('public/data/province-forest-area.json');
const researchEn = await read('public/research-en.html');
const researchTh = await read('public/research-th.html');

const bibleChapters = bible.chapters.length;
const bibleSources = Object.keys(bible.sources).length;
const seaCountries = sea.countries.length;
const tgoProjects = tgo.national.projects;
const tgoWithoutIssuance = tgo.national.projects - tgo.national.projects_with_issuance;
const provinces = ledger.provinces.length;

// The research notebook's chapters are the <h2> sections the build produced. The table of
// contents states the same count in words, and the count of its links is the third witness.
// The build counts the sections, so the gate counts them the same way rather than counting
// markdown headings — the academic audit contributes one of them.
const researchSections = (researchEn.match(/<h2 id="section-\d+"/g) || []).length;
const researchSectionsTh = (researchTh.match(/<h2 id="section-\d+"/g) || []).length;

/**
 * Every capability claim the product publishes.
 *
 * `truth` is computed from the shipped data. `published` lists where the number appears and
 * how to read it out. A `published` entry that no longer matches is a failure, not a skip.
 */
const CLAIMS = [
  {
    capability: 'the Bible reader',
    claim: 'the number of TH/EN chapters it holds',
    truth: bibleChapters,
    published: [
      {where: 'public/guide-en.html', match: /(\d+)\s+TH\/EN chapters/, label: 'the English guide'},
      {where: 'public/guide-th.html', match: /(\d+)\s+บท ไทย\/อังกฤษ/, label: 'the Thai guide'},
      {where: 'docs/GUIDE.en.md', match: /(\d+)\s+TH\/EN chapters/, label: 'the English guide source'},
      {where: 'docs/GUIDE.th.md', match: /(\d+)\s+บท ไทย\/อังกฤษ/, label: 'the Thai guide source'},
    ],
  },
  {
    capability: 'the Bible reader',
    claim: 'the number of source entries in its evidence shelf',
    truth: bibleSources,
    published: [
      {where: 'docs/SHIP_READINESS.md', match: /(\d+)\s+source entries/, label: 'the readiness document'},
    ],
  },
  {
    capability: 'the Bible reader',
    claim: 'the number of original CC0 diagram topics',
    truth: designDiagramIds.length,
    published: [
      {where: 'docs/SHIP_READINESS.md', match: /(\d+)\s+original diagram topics/, label: 'the readiness document'},
    ],
  },
  {
    capability: 'the Bible reader',
    claim: 'the number of paired chapters',
    truth: bibleChapters,
    published: [
      {where: 'docs/SHIP_READINESS.md', match: /(\d+)\s+paired chapters/, label: 'the readiness document'},
    ],
  },
  {
    capability: 'the research notebook',
    claim: 'the number of chapters in its index',
    truth: researchSections,
    published: [
      {where: 'public/research-en.html', match: /Contents ·\s*(\d+)\s*chapters/, label: 'the English notebook'},
      {where: 'public/research-th.html', match: /สารบัญ ·\s*(\d+)\s*บท/, label: 'the Thai notebook'},
    ],
  },
  {
    capability: 'the research notebook',
    claim: 'the number of chapters it holds, in both languages',
    truth: researchSections,
    also: [
      {
        where: 'public/research-en.html',
        count: () => (researchEn.match(/<li><a href="#section-\d+"/g) || []).length,
        label: 'the English notebook’s index links',
      },
      {
        where: 'public/research-th.html',
        count: () => (researchTh.match(/<li><a href="#section-\d+"/g) || []).length,
        label: 'the Thai notebook’s index links',
      },
    ],
  },
  {
    capability: 'the regional workspace',
    claim: 'the number of Southeast Asian countries',
    truth: seaCountries,
    published: [
      {where: 'public/js/bible.js', match: /Southeast Asia · (\d+) countries/, label: 'the Bible’s regional reading path'},
      {where: 'public/js/bible.js', match: /เอเชียตะวันออกเฉียงใต้ · (\d+) ประเทศ/, label: 'the Bible’s regional reading path, in Thai'},
    ],
  },
  {
    capability: 'the national workbench',
    claim: 'the number of provinces its grid covers',
    truth: provinces,
    published: [
      {where: 'public/partials/about.en.html', match: /sum of (\d+) provinces/, label: 'the English About page'},
      {where: 'public/partials/about.en.html', match: /(\d+) province boundaries/, label: 'the English About page’s provenance'},
      {where: 'public/partials/about.th.html', match: /ผลรวม (\d+) จังหวัด/, label: 'the Thai About page'},
    ],
  },
  {
    capability: 'the public registry context',
    claim: 'the number of T-VER records in its dated snapshot',
    truth: tgoProjects,
    published: [
      {where: 'public/partials/about.en.html', match: /Pulling the (\d+) records/, label: 'the English About page'},
    ],
  },
  {
    capability: 'the public registry context',
    claim: 'the number of projects without issuance',
    truth: tgoWithoutIssuance,
    published: [
      {where: 'public/partials/about.en.html', match: /The (\d+) projects without issuance/, label: 'the English About page'},
      {where: 'public/partials/about.th.html', match: /(\d+) โครงการที่ยังไม่ได้รับรอง/, label: 'the Thai About page'},
    ],
  },
  {
    capability: 'the historical province records',
    claim: 'the number of province-year observations it keeps as context',
    truth: provinceYears.length,
    published: [
      {where: 'README.md', match: /(\d+)\s+historical province-year observations/, label: 'the README’s capability table'},
    ],
  },
];

const rows = [];
const failures = [];

for (const claim of CLAIMS) {
  const checks = [];
  for (const entry of claim.published || []) {
    const text = await read(entry.where);
    const found = text.match(entry.match);
    if (!found) {
      failures.push(
        `${claim.capability}: ${entry.label} (${entry.where}) no longer publishes "${claim.claim}", so the claim cannot be checked.`
      );
      checks.push({where: entry.where, label: entry.label, published: null, truth: claim.truth, ok: false});
      continue;
    }
    const published = Number(found[1]);
    if (published !== claim.truth) {
      failures.push(
        `${claim.capability}: ${entry.label} (${entry.where}) says ${published}, but the shipped data holds ${claim.truth}.`
      );
    }
    checks.push({where: entry.where, label: entry.label, published, truth: claim.truth, ok: published === claim.truth});
  }
  for (const entry of claim.also || []) {
    const counted = entry.count();
    if (counted !== claim.truth) {
      failures.push(
        `${claim.capability}: ${entry.label} (${entry.where}) holds ${counted}, but the notebook holds ${claim.truth}.`
      );
    }
    checks.push({where: entry.where, label: entry.label, published: counted, truth: claim.truth, ok: counted === claim.truth});
  }
  rows.push({capability: claim.capability, claim: claim.claim, truth: claim.truth, checks});
}

await mkdir(resolve(ROOT, 'test-results/capability'), {recursive: true});
await writeFile(
  resolve(ROOT, 'test-results/capability/claims.json'),
  JSON.stringify({checkedAt: new Date().toISOString(), claims: rows}, null, 2)
);

console.log('The capability matrix, measured against the shipped data:\n');
for (const row of rows) {
  const where = row.checks.map(c => c.label).join(', ');
  const ok = row.checks.every(c => c.ok);
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${row.capability.padEnd(30)} ${String(row.truth).padStart(4)}  ${row.claim}`);
  console.log(`        published in: ${where}`);
}

if (failures.length) {
  console.error('\nFAIL capability claims: the product publishes numbers it does not hold.');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `\nPASS capability claims: ${rows.length} capabilities, ${rows.reduce((n, r) => n + r.checks.length, 0)} published figures, all equal to the shipped data.`
);
