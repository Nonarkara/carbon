import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AGB_TO_CO2E,rectFraction,readGrid,sumSelection,stockBand,ledgerRows,polygonFraction,polygonsOf,boxSideKm,probePoints,polygonContains} from '../public/js/ledger.js';
import {stock} from '../public/js/carbon.js';

const dir='public/data/ledger/';
const manifest=JSON.parse(readFileSync(dir+'manifest.json','utf8'));
const {national,provinces}=JSON.parse(readFileSync(dir+'provinces.json','utf8'));
const buf=readFileSync(dir+'grid.bin');
const grid=readGrid(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),manifest.grid);
const close=(a,b,rel=1e-5)=>assert.ok(Math.abs(a-b)<=rel*Math.max(Math.abs(a),Math.abs(b),1),`${a} vs ${b}`);
const THAILAND={west:95,east:107,south:4,north:22};

test('conversion factor is the T-VER workbench factor and the pipeline factor',()=>{
  close(AGB_TO_CO2E,stock(1,.27,.47),1e-12);
  close(AGB_TO_CO2E,manifest.conversion.agb_to_co2e,1e-12);
  close(AGB_TO_CO2E,2.1886333333,1e-9);
});
test('conservation: provinces sum to national for every additive quantity',()=>{
  assert.equal(provinces.length,77);
  assert.equal(new Set(provinces.map(p=>p.pcode)).size,77);
  for(const k of ['area_ha','forest_area_ha','agb_mg','forest_agb_mg','forest_sd_mg','forest_var_mg2','fossil_c_t','fire_co2_t','gfw_removals_mg_co2','gfw_emissions_mg_co2e','gfw_net_mg_co2e'])
    close(provinces.reduce((s,p)=>s+p[k],0),national[k],1e-5);
});
test('conservation: a box over all of Thailand returns the national totals from the grid',()=>{
  const {totals}=sumSelection(grid,{box:THAILAND});
  for(const k of manifest.grid.layers)close(totals[k],national[k],1e-5);
});
test('area: grid land area within 1% of the official 513,120 km²',()=>{
  const km2=national.area_ha/100;assert.ok(Math.abs(km2/513120-1)<.01,String(km2));
});
test('forest is a subset: forest area and forest AGB never exceed the all-land totals',()=>{
  for(const p of [national,...provinces]){assert.ok(p.forest_area_ha<=p.area_ha*(1+1e-9));assert.ok(p.forest_agb_mg<=p.agb_mg*(1+1e-9));}
});
test('rectangle overlap is exact on the sphere and additive',()=>{
  const cell={west:100,east:100.025,south:14,north:14.025};
  assert.equal(rectFraction(cell,{west:99,east:101,south:13,north:15}),1);
  assert.equal(rectFraction(cell,{west:101,east:102,south:13,north:15}),0);
  const west=rectFraction(cell,{west:99,east:100.0125,south:13,north:15}),east=rectFraction(cell,{west:100.0125,east:101,south:13,north:15});
  close(west,.5,1e-12);close(west+east,1,1e-12);
  const south=rectFraction(cell,{west:99,east:101,south:13,north:14.0125});
  assert.ok(south>.5&&south<.5001,'southern half of a northern-hemisphere cell holds slightly more area');
});
test('split boxes add up to the whole box for every layer',()=>{
  const a=sumSelection(grid,{box:{west:98,east:99.3137,south:17,north:20}}).totals,b=sumSelection(grid,{box:{west:99.3137,east:101,south:17,north:20}}).totals,w=sumSelection(grid,{box:{west:98,east:101,south:17,north:20}}).totals;
  for(const k of manifest.grid.layers)close(a[k]+b[k],w[k],1e-6);
});
test('polygon sub-sampling matches the exact rectangle result for a rectangle',()=>{
  const box={west:99.2,east:100.1,south:15.3,north:16.4};
  const poly={type:'Polygon',coordinates:[[[box.west,box.south],[box.east,box.south],[box.east,box.north],[box.west,box.north],[box.west,box.south]]]};
  const r=sumSelection(grid,{box}).totals.agb_mg,p=sumSelection(grid,{polygons:polygonsOf(poly)}).totals.agb_mg;
  close(p,r,.02);
  assert.equal(polygonFraction({west:0,east:1,south:0,north:1},polygonsOf(poly)),0);
});
test('uncertainty band: conservative contains optimistic; both contain the estimate; never negative',()=>{
  const b=stockBand(1000,100,100*100/50);
  assert.ok(b.conservative[0]<=b.optimistic[0]&&b.optimistic[0]<=b.value&&b.value<=b.optimistic[1]&&b.optimistic[1]<=b.conservative[1]);
  assert.equal(stockBand(10,100,1).conservative[0],0);
  const n=stockBand(national.forest_agb_mg,national.forest_sd_mg,national.forest_var_mg2);assert.ok(n.conservative[1]>n.optimistic[1]);
});
test('ledger rows never total across datasets and keep missing values null',()=>{
  const rows=ledgerRows({...national,gfw_removals_mg_co2:undefined},manifest.datasets);
  assert.ok(!rows.some(r=>/total|sum/i.test(r.id)));
  assert.equal(rows.find(r=>r.id==='forest_flux').value,null);
  const p=ledgerRows(provinces[0],manifest.datasets);
  for(const r of p){assert.ok(r.dataset&&r.unit);}
  const net=p.find(r=>r.id==='forest_net'),em=p.find(r=>r.id==='forest_emissions'),rem=p.find(r=>r.id==='forest_removals');
  close(net.value,em.value-rem.value,1e-4); // GFW's own sign convention: net = emissions − removals
});
test('GFW flux is annualised over the stated period, never counted twice',()=>{
  assert.equal(manifest.datasets.gfw.years,25);
  const r=ledgerRows(national,manifest.datasets).find(x=>x.id==='forest_removals');
  close(r.value,national.gfw_removals_mg_co2/25,1e-12);
});
test('resolution guard uses the shorter side, not the area',()=>{
  const small=ledgerRows(provinces[0],manifest.datasets,{minSideKm:boxSideKm({west:100,east:100.01,south:14,north:14.01})});
  assert.ok(small.find(r=>r.id==='fire').tooCoarse&&small.find(r=>r.id==='stock_forest').tooCoarse);
  const strip=ledgerRows(provinces[0],manifest.datasets,{minSideKm:boxSideKm({west:100,east:100.09,south:13,north:14})});
  assert.ok(strip.find(r=>r.id==='fire').tooCoarse,'a 10 × 110 km strip is narrower than one 28 km fire cell');
  assert.ok(!strip.find(r=>r.id==='fossil').tooCoarse&&!strip.find(r=>r.id==='stock_forest').tooCoarse);
  assert.ok(!ledgerRows(national,manifest.datasets).find(r=>r.id==='fire').tooCoarse);
});
test('fire categories reconcile with the fire-carbon yearly totals',()=>{
  for(const p of [national,...provinces]){
    const mean=Object.values(p.fire_c_t_years).reduce((a,b)=>a+b,0)/10;
    close(Object.values(p.fire_c_t_groups).reduce((a,b)=>a+b,0),mean,1e-4);
    close(p.fire_c_t_monthly.reduce((a,b)=>a+b,0),mean,1e-4);
  }
});
test('every manifest dataset version is cited in both research notebooks',()=>{
  for(const lang of ['en','th']){
    const doc=readFileSync(`docs/RESEARCH.${lang}.md`,'utf8');
    for(const [k,d] of Object.entries(manifest.datasets))if(d.version)assert.ok(doc.includes(d.version.split(' ')[0]),`${lang}: ${k} ${d.version}`);
  }
});
test('a centroid in a hole is not a province probe; a centroid in filled area is',()=>{
  const hole={type:'Polygon',coordinates:[[[0,0],[4,0],[4,4],[0,4],[0,0]],[[1,1],[3,1],[3,3],[1,3],[1,1]]]};
  const solid={type:'Polygon',coordinates:[[[0,0],[4,0],[4,4],[0,4],[0,0]]]};
  const holePts=probePoints(hole),solidPts=probePoints(solid);
  const mean=pts=>pts.reduce((a,[x,y])=>[a[0]+x/pts.length,a[1]+y/pts.length],[0,0]);
  const hc=mean(holePts);
  assert.equal(polygonContains(polygonsOf(hole),hc[0],hc[1]),false);
  assert.equal(holePts.length,5);
  const verts=solidPts.slice(0,5),sc=mean(verts);
  assert.equal(polygonContains(polygonsOf(solid),sc[0],sc[1]),true);
  assert.equal(solidPts.length,6);
  assert.ok(solidPts.some(([x,y])=>x===sc[0]&&y===sc[1]));
});
test('coarse and empty selections withhold numeric rows and uncertainty in exports',()=>{
  for(const [src,minSideKm] of [[national,1.5],[{...national,area_ha:0},100]]){
    const rows=ledgerRows(src,manifest.datasets,{minSideKm});
    for(const id of ['stock_forest','stock_all','fossil','fire']){
      const r=rows.find(r=>r.id===id);assert.equal(r.value,null,id);assert.equal(r.conservative,null);assert.equal(r.optimistic,null);
    }
  }
});
