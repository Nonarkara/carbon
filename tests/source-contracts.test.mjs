import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as c from '../public/js/source-contracts.js';
import {readGrid} from '../public/js/ledger.js';
const read=f=>JSON.parse(readFileSync('public/data/'+f));
test('current source families satisfy their own contracts',()=>{
 for(const [file,validator] of [['cci/stock-years.json','validStockYears'],['gfw/loss-years.json','validLossYears'],['ledger/manifest.json','validLedgerManifest'],['ledger/provinces.json','validProvinceLedger'],['ledger/provinces.geojson','validProvinceGeometry'],['ledger/nfi-check.json','validNFI'],['tgo/tver-forestry.json','validRegistry']])assert.ok(c[validator](read(file)),file);
});
test('stock and loss reject mixed units, periods, missing evidence and unknown flags',()=>{
 const stock=read('cci/stock-years.json');stock.meta.units.agb_mg='tonnes C';assert.equal(c.validStockYears(stock),false);
 const flags=read('cci/stock-years.json');flags.national.flag_ha.loss=null;assert.equal(c.validStockYears(flags),false);
 const period=read('gfw/loss-years.json');period.meta.years[3]=2099;assert.equal(c.validLossYears(period),false);
 const loss=read('gfw/loss-years.json');loss.national.natural_ha[0]=null;assert.equal(c.validLossYears(loss),false);
 const zero=read('gfw/loss-years.json');zero.national.primary_ha[0]=0;assert.equal(c.validLossYears(zero),true,'a real zero stays valid');
});
test('manifest conversion and registry destinations fail closed',()=>{
 const m=read('ledger/manifest.json');m.conversion.c_to_co2=1;assert.equal(c.validLedgerManifest(m),false);
 const d=read('tgo/tver-forestry.json');d.projects[0].url='javascript:alert(1)';assert.equal(c.validRegistry(d),false);
});
test('province geometry rejects malformed nesting, WGS84 points and unclosed rings before Leaflet',()=>{
 for(const coordinates of [[],[['100','14']],[[[100,14],[101,14],[101,15],[100,15]]],[[[100,14],[181,14],[101,15],[100,14]]]]){
  const d=read('ledger/provinces.geojson');d.features[0].geometry={type:'Polygon',coordinates};assert.equal(c.validProvinceGeometry(d),false);
 }
});
test('same-length corrupt binary cannot become a carbon estimate',()=>{
 const meta={count:2,rows:2,cols:2,layers:['area_ha']};
 const valid=()=>{const buffer=new ArrayBuffer(16);new Uint32Array(buffer,0,2).set([0,3]);new Float32Array(buffer,8,2).set([10,20]);return buffer;};
 assert.equal(readGrid(valid(),meta).layers.area_ha[1],20);
 const nan=valid();new Float32Array(nan,8,2)[0]=NaN;assert.throws(()=>readGrid(nan,meta),/gridValue/);
 const duplicate=valid();new Uint32Array(duplicate,0,2)[1]=0;assert.throws(()=>readGrid(duplicate,meta),/gridIndex/);
 const outside=valid();new Uint32Array(outside,0,2)[1]=4;assert.throws(()=>readGrid(outside,meta),/gridIndex/);
 assert.throws(()=>readGrid(valid().slice(0,12),meta),/gridSize/);
});
