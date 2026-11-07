import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lossFigures,lossHTML} from '../public/js/loss-view.js';

const data=JSON.parse(readFileSync('public/data/gfw/loss-years.json','utf8'));
const {provinces:ledger}=JSON.parse(readFileSync('public/data/ledger/provinces.json','utf8'));
const sum=a=>a.reduce((s,x)=>s+x,0);
// Values are stored to 0.1, so a sum of n of them may drift by n × 0.05 beyond the relative tolerance.
const close=(a,b,rel=1e-6,abs=0)=>assert.ok(Math.abs(a-b)<=rel*Math.max(Math.abs(a),Math.abs(b),1)+abs,`${a} vs ${b}`);

test('loss series: every province, 25 years, natural + plantation = all loss',()=>{
 assert.equal(Object.keys(data.provinces).length,77);
 assert.equal(data.meta.years.length,25);
 for(const s of [data.national,...Object.values(data.provinces)])for(let i=0;i<25;i++){
  close(s.natural_ha[i]+s.plantation_ha[i],s.loss_ha[i],1e-6,.15);
  assert.ok(s.primary_ha[i]<=s.natural_ha[i]+.2&&s.protected_ha[i]<=s.natural_ha[i]+.2);
  close(sum(Object.values(s.drivers).map(d=>d[i])),s.natural_ha[i],1e-6,.05*9);
 }
});
test('loss series: provinces sum to the national series for every quantity',()=>{
 for(const k of ['loss_ha','natural_ha','plantation_ha','primary_ha','protected_ha','emissions','natural_emissions'])
  for(let i=0;i<25;i++)close(sum(Object.values(data.provinces).map(p=>p[k][i])),data.national[k][i],1e-6,.05*78);
});
test('loss series: 25-year emissions equal the ledger’s GFW summary totals (two extracts, one model)',()=>{
 for(const p of ledger)close(sum(data.provinces[p.pcode].emissions),p.gfw_emissions_mg_co2e,.005);
});
test('loss view: the figures on screen are sums and shares of the series',()=>{
 const s=data.provinces.TH50,f=lossFigures(s,data.meta.years);
 close(f.natural,sum(s.natural_ha));close(f.recent,sum(s.natural_ha.slice(20))/5);
 assert.equal(f.latestYear,2025);
 const fmt=(v,d=0)=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:d}).format(v),esc=x=>String(x);
 const html=lossHTML({data,code:'TH50',lang:'en',fmt,esc});
 assert.equal((html.match(/class="loss-natural"/g)||[]).length,25);
 assert.ok(html.includes(fmt(f.natural)));assert.ok(html.includes('not deforestation'));
 assert.ok(lossHTML({data,code:null,lang:'th',fmt,esc}).includes('เลือกจังหวัด'),'a drawn box says why it has no series');
});
