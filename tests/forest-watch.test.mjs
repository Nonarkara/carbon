import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {watchRecord,priorityArea,validWatch,renderForestWatch} from '../public/js/forest-watch.js';
const data=JSON.parse(readFileSync('public/data/gfw/watch.json'));
const provinces=JSON.parse(readFileSync('public/data/ledger/provinces.json')).provinces;
test('GFW dated mask, version, source and all 77 province identities travel together',()=>{
 assert.equal(data.version,'v20261005');assert.equal(data.window.days,30);assert.equal(data.mask,'is__tree_cover_2022=true');
 assert.equal(data.dates[0],data.window.start);assert.ok(data.dates.at(-1)<data.window.endExclusive);
 assert.equal(data.dates.length,30);assert.equal(new Set(data.dates).size,30);
 assert.match(data.rawSha256,/^[a-f0-9]{64}$/);assert.equal(data.licence,'CC BY 4.0');
 assert.deepEqual(Object.keys(data.provinces).sort(),provinces.map(p=>p.pcode).sort());
 assert.match(data.source,/download\/csv/);assert.ok(!/api[_-]?key|token/i.test(data.source));
});
test('confidence totals conserve through provinces, country and daily chart',()=>{
 for(const level of data.confidenceLevels){
  const records=Object.values(data.provinces);
  assert.ok(Math.abs(records.reduce((s,r)=>s+r.area_ha[level],0)-data.national.area_ha[level])<1e-8);
  assert.equal(records.reduce((s,r)=>s+r.pixels[level],0),data.national.pixels[level]);
 }
 for(const r of [data.national,...Object.values(data.provinces)]){
  assert.equal(r.daily_ha.length,30);assert.ok(r.daily_ha.every(v=>Number.isFinite(v)&&v>=0));
  assert.ok(Math.abs(r.daily_ha.reduce((a,b)=>a+b,0)-Object.values(r.area_ha).reduce((a,b)=>a+b,0))<1e-8);
  assert.equal(priorityArea(r),r.area_ha.high+r.area_ha.highest);
 }
});
test('TH/EN context renders real values, table, five province actions and boundary absence',()=>{
 for(const lang of ['th','en']){
  const html=renderForestWatch(data,'TH',{lang,fmt:(v,d)=>v.toFixed(d),esc:s=>s,provinces});
  assert.equal((html.match(/data-watch-province=/g)||[]).length,5);
  assert.equal((html.match(/<tr>/g)||[]).length,31);assert.ok(html.includes('v20261005'));
  assert.ok(html.includes('#forest-watch'));assert.ok(html.includes('2026-09-05'));
 }
 assert.equal(watchRecord(data,'parcel'),null);
 assert.equal(renderForestWatch(data,'parcel',{}),'');
});

test('Malformed optional data is rejected before it reaches the ledger',()=>{assert.ok(validWatch(data));assert.ok(!validWatch({}));const d=structuredClone(data);d.national.daily_ha[0]=null;assert.ok(!validWatch(d));});
