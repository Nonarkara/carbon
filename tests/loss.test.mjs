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
test('loss rate: the denominator rebuilds the ledger’s extent, and the rate is the series over it',()=>{
 for(const p of ledger){const c=data.provinces[p.pcode];close(c.tree_cover_natural_ha+c.tree_cover_plantation_ha,p.gfw_extent_ha,.005,1);
  assert.ok(c.tree_cover_natural_ha>0);
  const f=lossFigures(c,data.meta.years);close(f.rate,100*sum(c.natural_ha.slice(20))/5/c.tree_cover_natural_ha);close(f.prior,sum(c.natural_ha.slice(15,20))/5);}
 for(const k of ['tree_cover_natural_ha','tree_cover_plantation_ha'])close(sum(Object.values(data.provinces).map(p=>p[k])),data.national[k],1e-6,.05*78);
});
test('loss CSV: every province-year, the same numbers as the JSON, and each row names its source',()=>{
 const text=readFileSync('public/data/gfw/loss-years.csv','utf8');assert.equal(text[0],'\ufeff','Excel needs the BOM for Thai names');
 const parse=l=>l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(x=>x.replace(/,$/,'').replace(/^"|"$/g,''));
 const [head,...rows]=text.slice(1).trim().split(/\r?\n/).map(parse),at=n=>head.indexOf(n);assert.equal(rows.length,78*25);
 for(const r of rows){const s=r[0]==='TH'?data.national:data.provinces[r[0]],i=data.meta.years.indexOf(+r[at('year')]);
  for(const [col,k] of [['tree_cover_lost_ha','loss_ha'],['outside_plantations_ha','natural_ha'],['inside_plantations_ha','plantation_ha'],['outside_in_primary_forest_ha','primary_ha'],['outside_in_protected_areas_ha','protected_ha'],['emissions_tco2e','emissions'],['emissions_outside_plantations_tco2e','natural_emissions']])assert.equal(+r[at(col)],s[k][i]);
  assert.ok(r[at('source')].includes('v20260327')&&r[at('source')].includes('not deforestation'));}
});
