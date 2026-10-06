import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {designChapters} from '../docs/bible/design.mjs';
import {designSvg,designDiagramIds} from '../public/js/bible-design-diagrams.js';
import {searchChapters} from '../public/js/bible-search.js';
test('Assessment-design editions retain detailed paired explanations and searchable practical methods',()=>{
 assert.equal(designChapters.length,14);
 for(const c of designChapters){for(const lang of ['th','en']){assert.ok(c.body[lang].length>1800,`${c.id}/${lang}`);assert.ok((c.body[lang].match(/^## /gm)||[]).length>=3);}assert.equal(c.reviewed,'2026-10-07');}
 assert.ok(searchChapters(designChapters,'หน่วยหน้าที่').some(c=>c.id==='product-design'));
 assert.ok(searchChapters(designChapters,'tonne-km','design').some(c=>c.id==='sme-worked'));
 assert.ok(searchChapters(designChapters,'ฟอกขาว','impacts').some(c=>c.id==='climate-impacts'));
});
test('Original learning diagrams expose accessible descriptions and conserve the worked quantities',async()=>{
 assert.equal(designDiagramIds.length,14);
 for(const id of designDiagramIds)for(const lang of ['en','th']){const svg=designSvg(id,lang);assert.ok(svg.includes('<title>'));assert.ok(svg.includes('<desc>'));assert.ok(svg.includes('CC0 1.0'));assert.ok(!/shadow|<filter|\bNaN\b|undefined/i.test(svg));assert.equal(await readFile(`public/images/bible/diagrams/${id}-${lang}.svg`,'utf8'),svg);}
 const rows=[2000*2.68/1000,2*1430/1000,50000*.48/1000,12000*.1/1000,10000*.8/1000];
 assert.equal(Number(rows.reduce((a,b)=>a+b,0).toFixed(2)),41.42);
 assert.equal(Number((rows.reduce((a,b)=>a+b,0)-10000*.48/1000).toFixed(2)),36.62);
 const svg=designSvg('sme-worked','en');for(const subtotal of ['8.22','24.00','9.20'])assert.ok(svg.includes(subtotal));
 const en=designChapters.find(c=>c.id==='sme-worked').body.en;assert.ok(en.includes('hypothetical'));assert.ok(en.includes('41.42'));assert.ok(en.includes('36.62'));assert.ok(en.includes('not a TGO-approved'));
});
test('Public-domain gallery has individual provenance and unchanged local file hashes',async()=>{
 const register=JSON.parse(await readFile('public/data/bible-artifacts.json','utf8'));
 assert.equal(register.artifacts.length,3);
 for(const a of register.artifacts){const file=await readFile('public/'+a.path);assert.equal(file.length,a.bytes);assert.equal(createHash('sha256').update(file).digest('hex'),a.sha256);assert.equal(a.rights,'Public domain');assert.ok(a.source.startsWith('https://'));assert.ok(a.original.startsWith('https://'));for(const lang of ['en','th'])assert.ok(a.alt[lang]&&a.caption[lang]&&a.title[lang]);assert.equal(a.modifications,'None; original downloaded bytes');}
});
