import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chapters} from '../docs/bible/content.mjs';
import {searchChapters} from '../public/js/bible-search.js';
import {stock,FACTORS} from '../public/js/carbon.js';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
test('Bible has equivalent bilingual chapters, resolvable references and complete dataset coverage',async()=>{
 const data=await read('public/data/bible.json'),manifest=await read('public/data/ledger/manifest.json');
 assert.equal(new Set(chapters.map(c=>c.id)).size,chapters.length);
 assert.equal(data.chapters.length,30);assert.equal(data.chapters.find(c=>c.id==='forest-watch').reviewed,'2026-10-05');
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
