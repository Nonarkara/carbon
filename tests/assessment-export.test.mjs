import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,METHOD} from '../public/js/carbon.js';
import {assessmentCSVRows,csvText} from '../public/js/assessment-export.js';
import {seaExportRows,regionalRecord,metricDisplay,seaSourcePeriod} from '../public/js/sea-model.js';
import {readFileSync} from 'node:fs';

test('Assessment numeric CSV keeps sources, method, unassessed uncertainty and credit status',()=>{
 const inputs={start:'2021-01-01',end:'2026-01-01',unit:'agb',previous:1100,current:1000,r:.27,cf:.47,burnedPercent:0,canopyDeath:'no',source:'Field report, "reviewed"\n2026',fireSource:''};
 const a={inputs,result:calculate(inputs),methodology:METHOD,status:'user-input-unverified-estimate',uncertainty:null,appVersion:'abc1234',exportedAt:'2026-11-04T00:00:00Z',tverRegistryContext:{status:'unavailable'}};
 const rows=assessmentCSVRows(a),[header,...data]=rows;
 assert.equal(data.length,6);
 for(const row of data){
  assert.equal(row.length,header.length);
  const v=Object.fromEntries(header.map((k,i)=>[k,row[i]]));
  assert.equal(v.inputSource,inputs.source);assert.equal(v.methodology,METHOD.code);
  assert.equal(v.methodologyVersion,2);assert.equal(v.uncertainty,'not assessed');assert.equal(v.issuedCreditsStatus,'not issued');assert.equal(v.registryContextStatus,'unavailable');
  assert.equal(v.rootShootRatio,.27);assert.equal(v.carbonFraction,.47);
 }
 const csv=csvText(rows);
 assert.match(csv,/"Field report, ""reviewed""\n2026"/);
 assert.ok(csv.includes('"'+a.result.net+'"'),'negative change is exported without a formula-text prefix');
 inputs.source='  =HYPERLINK("https://invalid.example")';
 assert.ok(csvText(assessmentCSVRows(a)).includes('"\'  =HYPERLINK('),'formula-like user evidence is inert spreadsheet text');
});

test('Regional CSV storage units match each quantity and scaled values recover the snapshot',()=>{
 const d=JSON.parse(readFileSync('public/data/sea/snapshot.json','utf8'));
 assert.equal(seaSourcePeriod(d,'gfw-peat','en'),'2000 reference year');
 assert.equal(seaSourcePeriod(d,'gfw-mangrove','th'),'ปีฐานอ้างอิง 2000');
 assert.equal(seaSourcePeriod({sources:{unknown:{}}},'unknown','en'),'Period not supplied');
 for(const c of [...d.countries,regionalRecord(d)]){
  const [header,...rows]=seaExportRows(d,c);
  const records=rows.map(row=>Object.fromEntries(header.map((k,i)=>[k,row[i]])));
  assert.equal(records.find(r=>r.metric==='forest_pct').storedUnit,'%');
  assert.equal(records.find(r=>r.metric==='co2_mt').storedUnit,'Mt CO₂/yr');
  assert.equal(records.find(r=>r.metric==='forest_removals_t_yr').storedUnit,'t CO₂/yr');
  for(const r of records){
   assert.equal(r.unit,metricDisplay(r.metric).unit);
   if(c[r.metric]===null){assert.equal(r.value,'');assert.equal(r.status,'missing; not zero');}
   else assert.ok(Math.abs(r.value*metricDisplay(r.metric).scale-c[r.metric])<1e-4);
   assert.equal(r.notCredits,true);assert.ok(r.period);assert.ok(r.sourceURL);
  }
 }
});
