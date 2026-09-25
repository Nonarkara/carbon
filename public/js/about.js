// About / research tab: loads the native TH or EN story and fills every figure from the shipped ledger,
// so the teaching text cannot drift from the data.
import {AGB_TO_CO2E,Z95,C_TO_CO2} from './ledger.js';

export function initAbout({getLang,fmt}){
  const body=document.querySelector('#aboutBody');let shown=null,national=null;
  const data=()=>national?Promise.resolve(national):fetch('data/ledger/provinces.json').then(r=>{if(!r.ok)throw Error('ledger:provinces');return r.json();}).then(d=>national=d.national);
  async function show(){
    const lang=getLang();if(shown===lang)return;
    const [html,n]=await Promise.all([fetch(`partials/about.${lang}.html`).then(r=>{if(!r.ok)throw Error('about:'+lang);return r.text();}),data()]);
    body.innerHTML=html;fill(n,lang);shown=lang;
  }
  function fill(n,lang){
    const th=lang==='th',m=fmt(n.fire_c_t_monthly.slice(1,4).reduce((a,b)=>a+b,0)/n.fire_c_t_monthly.reduce((a,b)=>a+b,0)*100,0)+'%';
    const fig={forestPct:fmt(100*n.forest_area_ha/n.area_ha,1)+'%',areaKm2:fmt(n.area_ha/100,0)+(th?' ตร.กม.':' km²'),febApr:m,
      bandInd:fmt(100*Z95*Math.sqrt(n.forest_var_mg2)/n.forest_agb_mg,2),bandCorr:fmt(100*Z95*n.forest_sd_mg/n.forest_agb_mg,0)};
    body.querySelectorAll('[data-fig]').forEach(e=>e.textContent=fig[e.dataset.fig]??'—');
    const mt=v=>v/1e6,rows=[
      ['absorb',th?'ป่าดูดซับ (GFW)':'Forests absorb (GFW)',mt(n.gfw_removals_mg_co2/25)],
      ['emit',th?'ป่าปล่อยจากการสูญเสียป่า (GFW)':'Forests release through loss (GFW)',mt(n.gfw_emissions_mg_co2e/25)],
      ['emit',th?'ไฟทุกประเภท CO₂ ขั้นต้น (GFED)':'All fires, gross CO₂ (GFED)',mt(n.fire_co2_t)],
      ['emit',th?'เชื้อเพลิงฟอสซิล (ODIAC)':'Fossil fuels (ODIAC)',mt(n.fossil_c_t*C_TO_CO2)]];
    const max=Math.max(...rows.map(r=>r[2]));
    const head=k=>`<p class="ab-side ${k}">${k==='absorb'?(th?'ด้านดูดซับ':'Taken up'):(th?'ด้านปล่อย · แสดงคู่กัน ไม่นำมาบวกกัน':'Released · shown side by side, never added')}</p>`;
    body.querySelector('#abLedger').innerHTML=head('absorb')+rows.map((r,i)=>(i===1?head('emit'):'')+`<div class="ab-row ${r[0]}"><span>${r[1]}</span><i style="width:${(100*r[2]/max).toFixed(1)}%"></i><b>${fmt(r[2],1)}</b></div>`).join('')+
      `<p class="ab-net">${th?'สุทธิของป่าตาม GFW':'Forest net, GFW'}: <b>${fmt(mt(n.gfw_net_mg_co2e/25),1)}</b> ${th?'ล้านตัน CO₂e ต่อปี (ติดลบ = ดูดซับสุทธิ)':'Mt CO₂e per year (negative = net sink)'} · ${th?'คาร์บอนสะสมในป่า':'forest carbon stock'} <b>${fmt(n.forest_agb_mg*AGB_TO_CO2E/1e9,2)}</b> ${th?'พันล้านตัน CO₂e (2020)':'billion t CO₂e (2020)'}</p>`;
    const mon=n.fire_c_t_monthly,mx=Math.max(...mon),names=th?['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    body.querySelector('#abFire').innerHTML=mon.map((v,i)=>`<div class="bar${i>=1&&i<=3?' season':''}" title="${names[i]}: ${fmt(v/1e6,2)} Mt C"><i style="height:${(100*v/mx).toFixed(1)}%"></i><span>${names[i]}</span></div>`).join('');
    // Conservation illustration: 10 × 8 squares, each owned by the side of the border its centre falls on.
    const g=body.querySelector('#abgrid'),S=26,NS='http://www.w3.org/2000/svg';
    for(let r=0;r<8;r++)for(let c=0;c<10;c++){const x=c*S,y=r*S,cx=40+x+S/2,cy=20+y+S/2,above=cy<60+(cx-40)*155/260;
      const rect=document.createElementNS(NS,'rect');rect.setAttribute('x',x+1);rect.setAttribute('y',y+1);rect.setAttribute('width',S-2);rect.setAttribute('height',S-2);rect.setAttribute('class',above?'il-pa':'il-pb');g.append(rect);
      const dot=document.createElementNS(NS,'circle');dot.setAttribute('cx',x+S/2);dot.setAttribute('cy',y+S/2);dot.setAttribute('r',1.6);dot.setAttribute('class','il-centre');g.append(dot);}
  }
  return {show,reset:()=>{shown=null;}};
}
