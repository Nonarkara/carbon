import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectionCalculations,renderCalculations} from '../public/js/selection-view.js';
import {AGB_TO_CO2E} from '../public/js/ledger.js';

const manifest=JSON.parse(readFileSync('public/data/ledger/manifest.json','utf8'));
const datasets=manifest.datasets,conv=manifest.conversion;
const n=JSON.parse(readFileSync('public/data/ledger/provinces.json','utf8')).national;
const t=k=>k,fmt=(v,d)=>Number(v).toLocaleString('en-US',{maximumFractionDigits:d||2}),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),getLang=()=>'en';
const rows=()=>[{id:'stock_forest',value:n.forest_agb_mg*AGB_TO_CO2E},{id:'fossil',value:n.fossil_c_t*44/12}];

test('displayed substitution conserves stock and fossil totals',()=>{
  const r=selectionCalculations(n,rows(),datasets,conv);
  assert.ok(Math.abs(r[0].inputs[0]*r[0].factor-r[0].value)<1e-4);
  assert.ok(Math.abs(r[0].inputs[0]*r[0].inputs[1]*r[0].inputs[2]*r[0].inputs[3]/r[0].inputs[4]-r[0].value)<1e-2);
  assert.equal(r[1].inputs[0]*r[1].factor,r[1].value);
  assert.equal(r[2].value,null);
  assert.equal(r[0].factor,AGB_TO_CO2E);
});
test('coarse selection cannot expose numeric stock',()=>{
  assert.equal(selectionCalculations(n,[{id:'stock_forest',value:42,tooCoarse:true}],datasets)[0].value,null);
});
test('stock substitution uses the manifest root ratio and carbon fraction',()=>{
  const html=renderCalculations({src:n,rows:rows(),datasets,conv,t,fmt,esc,getLang});
  assert.match(html,new RegExp(`1 \\+ ${conv.root_shoot}`));
  assert.match(html,new RegExp(`× ${conv.carbon_fraction} × 44 / 12`));
  assert.match(html,/data-calculation="stock"/);
  assert.doesNotMatch(html,/× 2\.188633/);
});
test('a lone combined factor cannot replace the named root and carbon fraction',()=>{
  const html=renderCalculations({src:{...n,forest_agb_mg:1000},rows:[{id:'stock_forest',value:1000*AGB_TO_CO2E}],datasets,conv:{agb_to_co2e:2.5},t,fmt,esc,getLang});
  assert.match(html,/1 \+ 0\.27/);
  assert.match(html,/× 0\.47 × 44 \/ 12/);
  assert.doesNotMatch(html,/2\.5/);
});
test('coarse selection renders the block without the withheld number',()=>{
  const html=renderCalculations({src:n,rows:[{id:'stock_forest',value:42,tooCoarse:true},{id:'fossil',value:null},{id:'forest_net',value:null}],datasets,conv,t,fmt,esc,getLang});
  assert.match(html,/data-calculation="stock"/);
  assert.doesNotMatch(html,/>42/);
  assert.match(html,/—/);
});
test('empty selection renders a calc-alert and never a numeric answer',()=>{
  const html=renderCalculations({src:{...n,area_ha:0},rows:rows(),datasets,conv,t,fmt,esc,getLang});
  assert.match(html,/calc-alert/);
  assert.doesNotMatch(html,/calc-answer/);
});
