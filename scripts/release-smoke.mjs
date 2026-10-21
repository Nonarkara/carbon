// Verify deployed bytes and operational boundaries; do not print private contents or credentials.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'https://carbon.nonarkara.org';
const get=path=>fetch(new URL(path,base),{signal:AbortSignal.timeout(15000)});
const local=JSON.parse(await readFile('public/version.json','utf8'));
const res=await get('/version.json');assert.equal(res.status,200);const live=await res.json();assert.equal(live.commit,local.commit,'live commit differs from local build');
for(const [header,part] of [['content-security-policy',"script-src 'self'"],['x-frame-options','SAMEORIGIN'],['x-content-type-options','nosniff'],['permissions-policy','geolocation=()']])assert.ok(res.headers.get(header)?.includes(part),header);
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const path of ['css/workspace.css','manifest.json','images/logos/axiom-navy-tile.png','css/ship.css','css/type.css','css/reading.css','js/manual.js','vendor/fonts/jost-latin-400-normal.woff2','vendor/fonts/jost-latin-600-normal.woff2','vendor/fonts/jost-latin-700-normal.woff2','vendor/fonts/prompt-thai-400-normal.woff2','vendor/fonts/prompt-thai-600-normal.woff2','vendor/fonts/prompt-thai-700-normal.woff2','vendor/fonts/licenses/Jost-OFL.txt','vendor/fonts/licenses/Prompt-OFL.txt','js/app.js','sea.html','css/sea.css','js/sea.js','js/sea-model.js','js/region-entry.js','data/sea/snapshot.json','data/sea/countries.geojson','js/bible-design-diagrams.js','js/bible-diagrams.js','data/bible-artifacts.json','images/bible/grinnell.jpg','images/bible/lake-mead.jpg','images/bible/coral.jpg','images/bible/diagrams/sme-worked-th.svg','css/flat-controls.css','css/kabonna.css','js/bible.js','data/gfw/watch.json','js/forest-watch.js','js/landscape.js','css/app.css','index.html','js/i18n.js','css/bible.css','bible.html','data/bible.json','data/scientific-audit.json','research-th.html','research-en.html']){
 const r=await get('/'+path);assert.ok(r.ok,path);assert.equal(hash(Buffer.from(await r.arrayBuffer())),hash(await readFile('public/'+path)),path);console.log('Exact live bytes: '+path);
}
for(const path of ['/.env','/context.md','/node_modules/','/research/raw/','/audit-nonexistent-path'])assert.equal((await get(path)).status,404,path);
const r=await get('/api/global');assert.equal(r.status,200);const d=await r.json();assert.equal(d.schemaVersion,1);assert.equal(d.feeds.length,4);
assert.deepEqual(d.feeds.map(f=>f.id).sort(),['eu','intensity','noaa','rggi']);
for(const f of d.feeds){assert.ok(['cache','fetched','fallback','unavailable'].includes(f.tier));assert.ok(f.source&&f.unit&&f.cadence&&f.url);if(f.value!==null){assert.ok(Number.isFinite(f.value));assert.ok(Number.isFinite(Date.parse(f.observedAt)));assert.ok(Date.parse(f.observedAt)<=Date.now()+86400000);}else assert.equal(f.tier,'unavailable');}
console.log(JSON.stringify({base,commit:live.commit,checkedAt:new Date().toISOString(),feeds:d.feeds.map(({id,tier,observedAt})=>({id,tier,observedAt})),result:'PASS: bytes, headers, private paths and feed envelopes. Not a field-accuracy or uptime guarantee.'},null,2));
