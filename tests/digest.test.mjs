// Non's Digest snapshot tests. The JSON is hand-curated from public news sources; this file
// asserts that the snapshot stays well-formed, that every item and trend carries the keys the
// dashboard depends on, and that the hash recorded in the snapshot actually matches the payload.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const d=JSON.parse(readFileSync('public/data/digest/vcm-news.json','utf8'));

test('snapshot has a version, snapshot date and SHA-256 hashes recorded by the ingest pipeline',()=>{
  assert.equal(d.schemaVersion,1);
  assert.match(d.snapshot,/^\d{4}-\d{2}-\d{2}$/);
  assert.equal(typeof d.raw_sha256,'string');
  assert.equal(d.raw_sha256.length,64);
  assert.equal(typeof d.pipeline_sha256,'string');
  assert.equal(d.pipeline_sha256.length,64);
  assert.match(d.purpose,/Non/);
});

test('every digest item carries a date, source URL and bilingual title + summary',()=>{
  const required=['id','date','source','url','title_en','title_th','summary_en','summary_th'];
  for(const it of d.items){
    for(const k of required)assert.ok(it[k],`item ${it.id} missing ${k}`);
    assert.match(it.url,/^https?:\/\//);
    assert.match(it.date,/^\d{4}-\d{2}-\d{2}$/);
    assert.ok(it.title_en.length>10&&it.summary_en.length>=5);
    assert.ok(it.title_th.length>2&&it.summary_th.length>=2);
  }
});

test('every trend has a direction flag, a series of dated numeric points, and a bilingual label + note',()=>{
  for(const t of d.trends){
    assert.ok(['up','down','flat'].includes(t.direction),`trend ${t.id} direction`);
    assert.ok(t.label_en.length>5&&t.label_th.length>2);
    assert.ok(Array.isArray(t.series)&&t.series.length>=2,`trend ${t.id} needs >=2 series points`);
    for(const p of t.series){
      assert.ok(typeof p.value==='number'&&Number.isFinite(p.value),`${t.id}.${p.label} value`);
      assert.match(String(p.date),/^\d{4}$|^\d{4}-\d{2}-\d{2}$/,`${t.id}.${p.label} date`);
      assert.ok(p.label&&p.unit);
    }
  }
});

test('item ids are unique and trend ids are unique',()=>{
  const ids=new Set();
  for(const it of d.items){assert.ok(!ids.has(it.id),`duplicate item ${it.id}`);ids.add(it.id);}
  const tids=new Set();
  for(const t of d.trends){assert.ok(!tids.has(t.id),`duplicate trend ${t.id}`);tids.add(t.id);}
});

test('snapshot references the TGO FOR&AGR portfolio trend so the moving-bar block has data',()=>{
  const hasTgo=d.trends.some(t=>t.id==='tgo-portfolio');
  assert.ok(hasTgo,'digest must include the tgo-portfolio trend for the carbon-map moving bar');
  const tr=d.trends.find(t=>t.id==='tgo-portfolio');
  // The trend must reconcile with tgo-forestry.json.
  const tgo=JSON.parse(readFileSync('public/data/tgo/tver-forestry.json','utf8'));
  assert.equal(tr.series.find(p=>p.label?.includes('Registered')||p.label?.includes('projects')).value,tgo.national.projects);
});

// Canonical JSON matching Python json.dumps(sort_keys=True, separators=(',',':'), ensure_ascii=True).
const sortDeep=v=>Array.isArray(v)?v.map(sortDeep):(v&&typeof v==='object')?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sortDeep(v[k])])):v;
const canonical=o=>JSON.stringify(sortDeep(o)).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));

test('recorded raw_sha256 matches the items + trends payload (no silent drift)',()=>{
  const expected=createHash('sha256').update(canonical({items:d.items,trends:d.trends}),'utf8').digest('hex');
  assert.equal(d.raw_sha256,expected,'recorded raw_sha256 must match the payload');
});

test('recorded pipeline_sha256 matches the ingest script bytes (script and snapshot stay in step)',()=>{
  const expected=createHash('sha256').update(readFileSync('scripts/ingest/digest.py')).digest('hex');
  assert.equal(d.pipeline_sha256,expected,'pipeline_sha256 must match scripts/ingest/digest.py - rerun the ingest to refresh');
});