import {test} from 'node:test';
import assert from 'node:assert/strict';
import {haversine,sphericalArea,formatDist,formatArea} from '../public/js/measure.js';

test('haversine distance between Bangkok and Chiang Mai is ~580 km',()=>{
  const d=haversine(13.7563,100.5018,18.7883,98.9853);
  assert.ok(d>550000&&d<620000,`expected ~580 km, got ${d/1000} km`);
});
test('haversine same point is zero',()=>{
  assert.equal(haversine(13.7563,100.5018,13.7563,100.5018),0);
});
test('sphericalArea of one-degree square near equator is ~1.2e10 m²',()=>{
  const ring=[[13,100],[13,101],[14,101],[14,100]];
  const a=sphericalArea(ring);
  assert.ok(a>1e10&&a<1.3e10,`expected ~1.2e10 m², got ${a}`);
});
test('sphericalArea is invariant to vertex order',()=>{
  const ring=[[13,100],[13,101],[14,101],[14,100]];
  const rev=[...ring].reverse();
  assert.equal(sphericalArea(ring),sphericalArea(rev));
});
test('formatDist renders km and metres',()=>{
  assert.ok(formatDist(1500).includes('กม.')||formatDist(1500).includes('km'));
  assert.ok(formatDist(500).includes('m'));
});
test('formatArea renders rai and square metres',()=>{
  assert.ok(formatArea(5000).includes('ไร่')||formatArea(5000).includes('rai'));
  assert.ok(formatArea(100).includes('ตร.ม.')||formatArea(100).includes('sq m'));
});

test('rai conversion uses 1600 square metres per rai',()=>{
 assert.match(formatArea(1600),/^1(?:[.,]00)? /);
 assert.match(formatArea(4000),/^2[.,]50? /);
});
