import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {creditFigures,creditChapters,creditMarket as market} from '../docs/bible/credits.mjs';
test('Singapore partner list preserves grouped status and does not invent a signed total',()=>{
 const a=market.article6,rows=a.singapore_ias,asean=rows.filter(r=>r.region==='asean');
 assert.equal(a.counts.total_ias_signed,null);
 assert.equal(a.counts.total_ia_partners_listed,rows.length);
 assert.equal(a.counts.partners_marked_in_force,rows.filter(r=>r.status==='entered_into_force').length);
 assert.equal(a.counts.asean_partners_listed,asean.length);
 assert.equal(a.counts.asean_entered_into_force,asean.filter(r=>r.status==='entered_into_force').length);
 assert.deepEqual(asean.filter(r=>r.status==='entered_into_force').map(r=>r.country).sort(),['Lao PDR','Thailand','Vietnam']);
 assert.equal(market.sources['sg-art6'].updated,'2026-11-20');assert.equal(market.sources['sg-art6'].checked,'2026-11-25');
 assert.ok(a.status_scope_en.includes('not a total of signed'));assert.ok(rows.every(r=>['entered_into_force','listed_not_marked_in_force'].includes(r.status)));
});
test('corresponding adjustment teaching changes NDC balance, not inventory or issuance entitlement',()=>{
 const chapter=creditChapters.find(c=>c.id==='sea-borders'),body=readFileSync('docs/bible/sea/sea-borders.md','utf8');
 assert.equal(chapter.reviewed,'2026-11-25');assert.ok(chapter.sources.includes('unfccc-art6-manual'));
 assert.ok(body.includes('NDC emissions balance'));assert.ok(body.includes('ดุลการปล่อยตาม NDC'));
 assert.ok(!body.includes('only ASEAN country'));assert.ok(!body.includes('back** into its own inventory'));
 for(const lang of ['en','th']){
  const figures=creditFigures(lang);
  assert.ok(figures['border-article6'].includes('NDC'));
  assert.ok(!figures['border-article6'].includes('back to its inventory'));
  assert.ok(!figures['border-ledger'].includes('one in force'));
  assert.ok(figures['border-ledger'].includes(lang==='th'?'ระบุมีผล 3':'3 marked in force'));
 }
});
test('Singapore quota is denominated in emissions and carries the 2026 rollover qualification',()=>{
 const body=readFileSync('docs/bible/sea/sea-borders.md','utf8');
 assert.ok(body.includes('5% of taxable emissions'));assert.ok(body.includes('5% ของการปล่อยที่เสียภาษี'));
 assert.ok(body.includes('2025 quota to carry into 2026'));assert.ok(body.includes('sg-icc-rollover')===false,'source key belongs in chapter metadata, not raw prose');
 assert.ok(market.sources['sg-icc-rollover'].url.startsWith('https://www.mse.gov.sg/'));
});
