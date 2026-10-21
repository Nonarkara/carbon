import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const poses=['pose-greet','pose-look','pose-both','pose-measure','pose-wonder','pose-stop'];

test('Carbona and คาร์บอนนะ are the public localized names',()=>{
  const i18n=readFileSync('public/js/i18n.js','utf8');
  assert.match(i18n,/title:'คาร์บอนนะ'/);
  assert.match(i18n,/title:'Carbona'/);
  assert.doesNotMatch(i18n,/title:'คาบอนนะ'/);
  assert.doesNotMatch(i18n,/title:'Forest Carbon'|title:'คาร์บอนป่าไม้'/);
  const html=readFileSync('public/index.html','utf8');
  assert.match(html,/class="kabonna-mark" src="images\/brand\/ct-mark.png" width="40" height="40"/);
  assert.match(html,/<title>Carbona/);
});

test('the historical six poses and original mark remain available',()=>{
  const mark=readFileSync('public/images/kabonna/mark.svg','utf8');
  assert.match(mark,/viewBox="0 0 64 64"/);
  assert.equal(readFileSync('public/favicon.svg','utf8'),mark);
  for(const name of poses){
    const svg=readFileSync(`public/images/kabonna/${name}.svg`,'utf8');
    assert.match(svg,/viewBox="0 0 200 240"/,name);
    assert.match(svg,/fill="#ffcc00"/,name);
    assert.match(svg,/fill="#5f9e48"/,name);
  }
});

test('both research notebooks explain the name and show every pose',()=>{
  for(const lang of ['en','th']){
    const doc=readFileSync(`docs/RESEARCH.${lang}.md`,'utf8');
    assert.match(doc,/^## 13 · /m);
    assert.match(doc,/Glocker et al\., 2009/);
    assert.match(doc,/Nittono et al\., 2012/);
    for(const name of poses)assert.match(doc,new RegExp(`images/kabonna/${name}\\.svg`));
  }
});
