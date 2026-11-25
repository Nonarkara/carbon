import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const read=p=>readFile(p,'utf8');
test('both research editions preserve accounting families, complete standards and inventory qualifications',async()=>{
 for(const lang of ['th','en']){
  const text=await read(`docs/RESEARCH.${lang}.md`);
  for(const standard of ['ISO 14064-1:2018','ISO 14067:2018','T-VER-S-METH-13-01 v2','± 0.25','2015–2024'])assert.ok(text.includes(standard),`${lang}: ${standard}`);
  assert.ok(text.includes(lang==='th'?'2556–2561':'2013–2018'));
  const paragraphs=text.split(/\n\n/).filter(p=>p.length>120&&!p.startsWith('<')&&!p.startsWith('|')&&!p.startsWith('```'));
  assert.equal(new Set(paragraphs).size,paragraphs.length,`${lang}: repeated paragraph`);
  assert.ok(!text.includes('class="station-strip"'),'independent accounting families are not a sequential process');
 }
});
test('display derivatives retain original provenance and materially reduce gallery transfer',async()=>{
 const originals=JSON.parse(await read('public/data/bible-artifacts.json')).artifacts;
 const displays=JSON.parse(await read('public/data/bible-display-images.json')).images;
 for(const original of originals){
  const bytes=await readFile('public/'+original.path),display=displays.find(d=>d.id===original.id);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),original.sha256);
  assert.equal(display.sourceSha256,original.sha256);assert.ok(display.width<=1200&&display.height<=1200);
  const encoded=await readFile('public/'+display.path);assert.equal(encoded.length,display.bytes);
  assert.equal(createHash('sha256').update(encoded).digest('hex'),display.sha256);
 }
 assert.ok(displays.reduce((n,d)=>n+d.bytes,0)<originals.reduce((n,d)=>n+d.bytes,0)*.25,'at least75% total gallery reduction; canonical downloads remain intact');
});
