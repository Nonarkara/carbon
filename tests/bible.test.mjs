import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chapters} from '../docs/bible/content.mjs';
import {creditChapters,creditFigures} from '../docs/bible/credits.mjs';
import {searchChapters} from '../public/js/bible-search.js';
import {stock,FACTORS} from '../public/js/carbon.js';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
test('Bible has equivalent bilingual chapters, resolvable references and complete dataset coverage',async()=>{
 const data=await read('public/data/bible.json'),manifest=await read('public/data/ledger/manifest.json');
 assert.equal(new Set(chapters.map(c=>c.id)).size,chapters.length);
 assert.equal(data.chapters.length,68);assert.equal(data.chapters.find(c=>c.id==='forest-watch').reviewed,'2026-10-05');
 for(const c of data.chapters){for(const lang of ['th','en']){assert.ok(c.title[lang]);assert.ok(c.summary[lang]);assert.ok(c.body[lang].length>300);assert.ok(c.html[lang].includes('<p>'));assert.ok(c.diagram[lang].length>=3);}assert.equal(c.diagram.en.length,c.diagram.th.length);for(const s of c.sources)assert.ok(data.sources[s],`${c.id}: ${s}`);for(const id of c.related)assert.ok(chapters.find(c=>c.id===id));}
 for(const [key,d] of Object.entries(manifest.datasets)){assert.ok(data.sources[key]);assert.ok(data.chapters.find(c=>c.id==='sources').sources.includes(key));if(d.version)assert.ok(data.sources[key].detail.includes(d.version));}
 for(const target of Object.values(data.coverage))assert.ok(chapters.find(c=>c.id===target));
});
test('Bilingual search combines terms and category without damaging Thai marks',()=>{
 assert.ok(searchChapters(chapters,'มวลชีวภาพ').some(c=>c.id==='forest-stock'));
 assert.ok(searchChapters(chapters,'Scope 2').some(c=>c.id==='scopes'));
 assert.deepEqual(searchChapters(chapters,'Scope 2','credits'),[]);
 assert.ok(searchChapters(chapters,'ＡＧＢ','forest').some(c=>c.id==='forest-stock'));
 assert.deepEqual(searchChapters(chapters,'this-is-not-present-in-any-chapter'),[]);
 assert.equal(searchChapters(chapters,'  ').length,chapters.length);
 assert.ok(searchChapters(chapters,'aerosol vegetation').some(c=>c.id==='atmosphere'));
});
test('Worked stock derives from deployed national AGB and shared factors',async()=>{
 const data=await read('public/data/bible.json'),p=await read('public/data/ledger/provinces.json');
 const example=data.chapters.find(c=>c.id==='forest-stock').example;
 const expected=new Intl.NumberFormat('en-US',{maximumFractionDigits:4}).format(stock(p.national.forest_agb_mg,FACTORS.general.r,FACTORS.general.cf));
 assert.ok(example.formula.includes(expected));assert.ok(example.formula.includes('(1 + 0.27) × 0.47 × 44 / 12'));assert.ok(example.note.en.includes('Systematic bias excluded'));
});

test('The three credit-teaching chapters are bilingual, grouped as credits, and fully sourced',async()=>{
 assert.equal(creditChapters.length,3);
 const ids=['sea-what-is-a-credit','sea-borders','sea-industry'];
 assert.deepEqual(creditChapters.map(c=>c.id),ids);
 for(const c of creditChapters){
  // Grouped as credits so they appear under the existing credits filter, not as more regional chapters.
  assert.equal(c.group,'credits');
  for(const lang of ['th','en']){assert.ok(c.body[lang].length>2500,c.id+'/'+lang);assert.ok(c.title[lang]&&c.summary[lang]);}
  assert.ok(c.sources.length>=2,c.id);
 }
 const all=creditChapters.flatMap(c=>c.sources);
 assert.ok(all.includes('sea-market'),'the market snapshot must be cited');
 assert.ok(all.includes('sg-art6')||all.includes('sg-th-ia'),'Article 6 agreements must be cited');
});
test('Credit figures are generated from the deployed snapshots, so a diagram cannot drift from its numbers',async()=>{
 const en=creditFigures('en'),th=creditFigures('th');
 assert.deepEqual(Object.keys(en).sort(),['border-article6','border-ledger','credit-anatomy','credit-physics','industry-gap','industry-issuance']);
 for(const [k,v] of Object.entries(en)){
  assert.ok(v.startsWith('<figure class="illustration">'),k);
  assert.match(v,/<svg[^>]*role="img"/,k);
  assert.match(v,/<title>/,k);
  assert.match(v,/<figcaption>/,k);
  assert.notEqual(v,th[k],k+' Thai figure is identical to the English one');
 }
 // The numbers printed in the issuance chart must be the numbers in the deployed market snapshot.
 const market=await read('public/data/sea/carbon-market.json');
 for(const c of market.issuance.by_country){
  if(c.total==null)continue;
  assert.ok(en['industry-issuance'].includes(c.total.toFixed(2)),`issuance figure is missing ${c.iso3} ${c.total}`);
 }
 // Every published sector must appear, and the shares on screen must add to the whole. A hand-picked
 // list once dropped 'other' (1.9%), so the figure showed 98.1% with no explanation.
 const shown=[...en['industry-gap'].matchAll(/>([0-9]+\.[0-9])%</g)].map(m=>Number(m[1]));
 assert.equal(shown.length,market.issuance.by_sector.length,'the gap figure must show every published sector');
 for(const s of market.issuance.by_sector)assert.ok(shown.includes(s.share_pct),`sector share missing: ${s.sector}`);
 assert.ok(Math.abs(shown.reduce((a,b)=>a+b,0)-100)<0.05,`shown shares sum to ${shown.reduce((a,b)=>a+b,0)}, not 100`);
});
