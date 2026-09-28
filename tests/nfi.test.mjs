import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const c=JSON.parse(readFileSync('public/data/ledger/nfi-check.json','utf8'));
const close=(a,b,rel=1e-6)=>assert.ok(Math.abs(a-b)<=rel*Math.max(Math.abs(a),Math.abs(b)),`${a} vs ${b}`);
// FREL/FRL 2021 Table 6 (2016 area = stable + gain) and Table 13 (cycle 3 AGB, carbon stock)
const AREA={evergreen:5892252+9364,deciduous:10985093+100677,mangrove:201668+39669};
const AGB={evergreen:136.327,deciduous:65.465,mangrove:120.779},STOCK={evergreen:321.864,deciduous:135.381,mangrove:310.134};
test('inventory totals reproduce the FREL tables',()=>{
  const n=c.nfi.national,area=Object.values(AREA).reduce((a,b)=>a+b,0);
  close(n.forest_area_ha,area);
  close(n.agb_total_t,Object.keys(AREA).reduce((s,k)=>s+AREA[k]*AGB[k],0),1e-4);
  close(n.carbon_stock_tco2e,Object.keys(AREA).reduce((s,k)=>s+AREA[k]*STOCK[k],0),1e-4);
  close(n.agb_mean_t_ha,n.agb_total_t/n.forest_area_ha,1e-3);
  for(const [k,rs] of [['evergreen',.37],['deciduous',.20],['mangrove',.49]])close(STOCK[k],AGB[k]*(1+rs)*.47*44/12,1e-4);
});
test('the bound: an unbiased map would need implausibly dense extra tree cover',()=>{
  const x=c.comparison,m=c.map;
  close(x.implied_agb_t_ha_of_extra_tree_cover_if_map_unbiased_on_nfi_forest,(m.agb_total_t-c.nfi.national.agb_total_t)/(m.forest_area_ha-c.nfi.national.forest_area_ha),1e-3);
  // The published conclusion ("the map reads high") holds only while the implied density exceeds the inventory's
  // densest forest type. If new data break this, the research text must change.
  assert.ok(x.implied_agb_t_ha_of_extra_tree_cover_if_map_unbiased_on_nfi_forest>AGB.evergreen);
  assert.ok(Object.values(x.map_over_nfi_on_nfi_forest_if_extra_holds).every(r=>r>1));
  // Still true after correcting the inventory for its own allometric underestimate (FREL Table 10)
  const a=x.allometry_corrected;assert.ok(a.implied_agb_t_ha_of_extra_tree_cover>a.evergreen_agb_t_ha);
  assert.ok(Object.values(a.map_over_nfi_on_nfi_forest_if_extra_holds).every(r=>r>1));
  close(a.evergreen_agb_t_ha,136.327/(1-.136),1e-3);
});
test('rejected stratification stays rejected and unused',()=>{
  const g=c.cgls_forest_type_check;assert.equal(g.used,false);assert.ok(g.evergreen_share>.9&&g.frel_evergreen_share<.4);
});
