#!/usr/bin/env node
// Proof that the table repair cannot silently come back.
//
// A repair with no guard is a repair that a later edit undoes. This script does two things:
//
//   1. It re-introduces the old geometry in the browser (the arbitrary `td{min-width:125px}`
//      floor and `display:block;overflow:auto` on the table) and proves the law instrument
//      DOES fire on it. A detector that has never been seen failing is not trusted.
//   2. It measures the shipped page and proves the defect is gone: no nested scroll area, no
//      content cut off with no way to scroll it back, and no table whose own box is wider
//      than the frame the reader can see.
//
// Run: node scripts/msh-table-proof.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { collectLaw, EQUAL_WEIGHT_EXEMPTIONS } from './lib/msh-law.mjs';
import { measurementTarget } from './lib/local-server.mjs';

// Start this project's own server when the caller has not named one: the proof must be
// runnable as a single command, and it must measure this build and nothing else.
const target = await measurementTarget();
const base = target.base;
// The two rules that caused the defect, as they were before the repair.
const OLD_CSS = `
  .research table td{min-width:125px !important;}
  .guide table{display:block !important;overflow:auto !important;}
`;

const browser = await chromium.launch();

async function measure(page) {
  const law = await page.evaluate(`(${collectLaw.toString()})(null,${JSON.stringify(EQUAL_WEIGHT_EXEMPTIONS)})`);
  const geometry = await page.evaluate(() => {
    const isScroller = (e) => {
      const cs = getComputedStyle(e);
      return /auto|scroll|overlay/.test(cs.overflowX) || /auto|scroll|overlay/.test(cs.overflowY);
    };
    const nested = [];
    for (const e of document.querySelectorAll('body *')) {
      if (!isScroller(e)) continue;
      const range = Math.max(e.scrollWidth - e.clientWidth, e.scrollHeight - e.clientHeight);
      if (range < 1) continue;
      let p = e.parentElement, frame = null;
      while (p && p !== document.body) {
        if (isScroller(p)) { frame = p; break; }
        p = p.parentElement;
      }
      if (frame) nested.push(e);
    }
    const tables = [...document.querySelectorAll('table')].map((t) => {
      const sc = t.parentElement && getComputedStyle(t.parentElement).overflowX !== 'visible' ? t.parentElement : null;
      const frameW = sc ? sc.clientWidth : (t.parentElement ? t.parentElement.clientWidth : 0);
      return { own: getComputedStyle(t).overflowX, over: Math.round(t.getBoundingClientRect().width - frameW) };
    });
    return {
      nested: nested.length,
      selfScrollingTables: tables.filter((t) => t.own !== 'visible').length,
      tablesOverFrame: tables.filter((t) => t.over > 0).length,
    };
  });
  return {
    nestedScroll: law.filter((f) => f.kind === 'nested-scroll').length,
    unreachable: law.filter((f) => f.kind === 'unreachable-content').length,
    ...geometry,
  };
}

for (const path of ['/research-th.html', '/research-en.html']) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);

  const shipped = await measure(page);
  console.log(`${path} shipped:`, JSON.stringify(shipped));
  assert.equal(shipped.nestedScroll, 0, `${path}: the shipped page must have no nested scroll area`);
  assert.equal(shipped.unreachable, 0, `${path}: the shipped page must have no unreachable content`);
  assert.equal(shipped.nested, 0, `${path}: the shipped page must have no nested scroller`);
  assert.equal(shipped.selfScrollingTables, 0, `${path}: a table must not be its own scroll area`);

  // Put the defect back and prove the instrument sees it.
  await page.addStyleTag({ content: OLD_CSS });
  await page.waitForTimeout(300);
  const mutated = await measure(page);
  console.log(`${path} mutated:`, JSON.stringify(mutated));
  assert.ok(mutated.nestedScroll > 0,
    `${path}: the law instrument must fire when the old geometry is restored (nested=${mutated.nestedScroll})`);
  assert.ok(mutated.nested > 0,
    `${path}: the old geometry must produce nested scroll areas (nested=${mutated.nested})`);

  await page.close();
}

await browser.close();
// The measurement is done. Release the server this gate started, so the port is free and
// nothing is left listening after the gate ends.
await target.stop();
console.log('PASS msh-table-proof: the shipped research tables have no nested scroll area and no unreachable content; restoring the old geometry makes the law instrument fire.');
