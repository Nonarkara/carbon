import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {changeUncertainty,requiredIndependentUnits} from '../scripts/lib/audit-math.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
test('Two-date variance includes covariance and rejects invalid assumptions',()=>{
 assert.equal(changeUncertainty(10,10,1).variance,0);
 assert.equal(changeUncertainty(10,10,-1).variance,400);
 assert.equal(changeUncertainty(10,10,0).variance,200);
 assert.equal(changeUncertainty(10,10,.5).half95,19.6);
 assert.equal(changeUncertainty(2,3,1).variance,1);
 for(const args of [[-1,10,0],[10,10,1.01],[10,10,NaN]])assert.throws(()=>changeUncertainty(...args));
});
test('Sample planning applies design effect before rounding, without a TGO-minimum claim',()=>{
 assert.equal(requiredIndependentUnits(.6,.1),139);
 assert.equal(requiredIndependentUnits(.6,.1,2),277);
 for(const args of [[.6,0],[.6,.1,.5],[Infinity,.1]])assert.throws(()=>requiredIndependentUnits(...args));
});
test('Executed diagnostics have exact provenance, conservation and honest validation status',async()=>{
 const a=await read('public/data/scientific-audit.json');
 for(const [path,hash] of Object.entries(a.inputSha256))assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'),hash);
 assert.equal(a.national.province_count,77);
 for(const c of a.conservation)assert.ok(Math.abs(c.relative_difference)<1e-6,c.key);
 assert.ok(Math.abs(a.national_grid_agb_relative_difference)<1e-6);
 for(const done of Object.values(a.validation))assert.equal(done,false);
 assert.match(a.nfiComparison.status,/not an identified map bias/);
 assert.match(a.polygonSensitivity.status,/not ground truth/);
 const positive=a.parameterSensitivity.scenarios.find(s=>s.id==='R-plus');assert.ok(Math.abs(positive.relative_pct-100*.05/1.27)<1e-9);
 assert.ok(a.resolutionGuard.rows.find(x=>x.id==='stock_forest').tooCoarse);
});
test('Bilingual research exposes the audit, every deployed version and unsupported tests',async()=>{
 const a=await read('public/data/scientific-audit.json');
 for(const lang of ['en','th']){
  const html=await readFile(`public/research-${lang}.html`,'utf8');
  assert.ok(html.includes('section-15'));assert.ok(html.includes('data/scientific-audit.json'));assert.ok(!html.includes('<!-- scientific-results -->'));
  for(const d of Object.values(a.datasetVersions))assert.ok(html.includes(d.version),d.version);
 }
 const en=await readFile('docs/RESEARCH.en.md','utf8');assert.ok(!en.includes('carries a measured bias'));assert.ok(!en.includes("reproduces ESA's LiDAR-based aggregated errors"));assert.ok(en.includes('Rejected forest-type matching experiment'));
 const bible=await read('public/data/bible.json');assert.ok(bible.chapters.find(c=>c.id==='scientific-audit').html.th.includes('Cov(S₁,S₀)'));
});
