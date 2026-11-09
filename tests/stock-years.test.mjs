import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stockFigures,stockHTML} from '../public/js/stock-view.js';

const data=JSON.parse(readFileSync('public/data/cci/stock-years.json','utf8'));
const {provinces:ledger}=JSON.parse(readFileSync('public/data/ledger/provinces.json','utf8'));
const sum=a=>a.reduce((s,x)=>s+x,0);
const close=(a,b,rel=1e-6,abs=0)=>assert.ok(Math.abs(a-b)<=rel*Math.max(Math.abs(a),Math.abs(b),1)+abs,`${a} vs ${b}`);
const y2020=data.meta.years.indexOf(2020);

test('stock series: 2020 equals the ledger, and provinces sum to Thailand every year',()=>{
 assert.equal(data.meta.years.length,10);assert.equal(Object.keys(data.provinces).length,77);
 for(const p of ledger)close(data.provinces[p.pcode].agb_mg[y2020],p.agb_mg,1e-4,1);
 data.meta.years.forEach((_,i)=>close(sum(Object.values(data.provinces).map(p=>p.agb_mg[i])),data.national.agb_mg[i],1e-6,.05*78));
});
test('change flags: the classes partition each province’s area',()=>{
 for(const p of ledger)close(sum(Object.values(data.provinces[p.pcode].flag_ha)),p.area_ha,1e-6,.5);
 for(const k of data.meta.change.classes)close(sum(Object.values(data.provinces).map(p=>p.flag_ha[k])),data.national.flag_ha[k],1e-6,.05*78);
});
test('change flags: this build reproduced ESA’s published 2019–2020 flags',()=>{
 assert.ok(data.meta.validation.agreement>.995&&data.meta.validation.agreement_changed_pixels>.98,JSON.stringify(data.meta.validation));
 assert.deepEqual([data.meta.change.from,data.meta.change.to],[2017,2024]);
});
test('stock view: shares come from the flags, and it never states a subtraction as a trend',()=>{
 const s=data.provinces.TH50,f=stockFigures(s);
 assert.equal(f.land,sum(Object.entries(s.flag_ha).filter(([k])=>k!=='none').map(([,v])=>v)));
 close(sum(Object.values(f.shares)),100);
 const fmt=(v,d=0)=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:d}).format(v),esc=x=>String(x);
 const html=stockHTML({data,code:'TH50',lang:'en',fmt,esc,toCo2e:2});
 assert.equal((html.match(/<dt>20\d\d<\/dt>/g)||[]).length,10);assert.ok(html.includes(`${f.shares.loss.toFixed(1)}%`));assert.ok(html.includes('is not a trend'));
 assert.equal(stockHTML({data,code:null,lang:'th',fmt,esc,toCo2e:2}),'','a drawn box has no series and shows no block');
});
