import {test} from 'node:test';
import assert from 'node:assert/strict';
import {esc} from '../public/js/geocode.js';

test('esc escapes HTML entities',()=>{
  assert.equal(esc('<script>alert(1)</script>'),'&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(esc('a&b'),'a&amp;b');
  assert.equal(esc('"quotes"'),'&quot;quotes&quot;');
  assert.equal(esc("it's"),'it&#39;s');
});
test('esc passes safe text through',()=>{
  assert.equal(esc('Bangkok'),'Bangkok');
  assert.equal(esc('กรุงเทพมหานคร'),'กรุงเทพมหานคร');
  assert.equal(esc(null),'');
  assert.equal(esc(undefined),'');
});
