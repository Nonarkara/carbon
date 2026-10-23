import {test} from 'node:test';
import assert from 'node:assert/strict';
import {markerSize} from '../public/js/urban.js';

test('markerSize scales with population',()=>{
  assert.equal(markerSize(6000000),11);
  assert.equal(markerSize(2000000),9);
  assert.equal(markerSize(700000),7);
  assert.equal(markerSize(200000),5);
  assert.equal(markerSize(10000),4);
  assert.equal(markerSize(0),4);
});
test('markerSize thresholds',()=>{
  assert.ok(markerSize(4999999)<11);
  assert.ok(markerSize(1000000)===9);
  assert.ok(markerSize(999999)===7);
});
