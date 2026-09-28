// About / research tab: loads the native TH or EN story and fills every figure from the shipped ledger,
// so the teaching text cannot drift from the data.
import {AGB_TO_CO2E,Z95,C_TO_CO2} from './ledger.js';

export function initAbout({getLang,fmt}){
  const body=document.querySelector('#aboutBody');let shown=null,store=null;
  const data=()=>store?Promise.resolve(store):Promise.all([
    fetch('data/ledger/provinces.json').then(r=>{if(!r.ok)throw Error('ledger:provinces');return r.json();}),
    fetch('data/ledger/manifest.json').then(r=>{if(!r.ok)throw Error('ledger:manifest');return r.json();}),
    fetch('data/tgo/tver-forestry.json').then(r=>{if(!r.ok)throw Error('tgo');return r.json();})
  ]).then(([p,m,t])=>store={national:p.national,gfwYears:m.datasets.gfw.years,cciYear:m.datasets.cci.year,tgo:t,provinceNames:Object.fromEntries(p.provinces.map(x=>[x.pcode,x]))});
  async function show(){
    const lang=getLang();if(shown===lang)return;
    const [html,s]=await Promise.all([fetch(`partials/about.${lang}.html`).then(r=>{if(!r.ok)throw Error('about:'+lang);return r.text();}),data()]);
    body.innerHTML=html;fill(s,lang);shown=lang;
  }
  function fill(s,lang){
    const n=s.national;
    const th=lang==='th',m=fmt(n.fire_c_t_monthly.slice(1,4).reduce((a,b)=>a+b,0)/n.fire_c_t_monthly.reduce((a,b)=>a+b,0)*100,0)+'%';
    const tgo=s.tgo,topPCode=Object.entries(tgo.provinces).sort((a,b)=>b[1].projects-a[1].projects)[0];
    const topName=topPCode?(s.provinceNames[topPCode[0]]?(th?s.provinceNames[topPCode[0]].name_th:s.provinceNames[topPCode[0]].name_en):'—'):'—';
    const restLabel=th?`${fmt(tgo.multi.projects,0)} ครอบคลุมหลายจังหวัด · ${fmt(tgo.unlocated.projects,0)} ไม่ระบุจังหวัด`:`${fmt(tgo.multi.projects,0)} multi-province · ${fmt(tgo.unlocated.projects,0)} no province`;
    const std=tgo.projects.filter(p=>p.program==='standard').length,prem=tgo.projects.filter(p=>p.program==='premium').length;
    const byFam={};for(const p of tgo.projects)for(const f of (p.families.length?p.families:['unknown']))byFam[f]=(byFam[f]||0)+1;
    const topFam=Object.entries(byFam).sort((a,b)=>b[1]-a[1])[0];
    const byDev={};for(const p of tgo.projects){const k=p.developer||'—';if(!byDev[k])byDev[k]={n:0,exp:0,iss:0};byDev[k].n++;byDev[k].exp+=p.expected_tco2e_yr||0;byDev[k].iss+=p.issued_tco2e||0;}
    const topDev=Object.entries(byDev).sort((a,b)=>b[1].exp-a[1].exp)[0];
    const tl={};for(const p of tgo.projects)for(const i of p.issuances){const y=i.certified?i.certified.slice(0,4):null;if(y)tl[y]=(tl[y]||0)+(i.tco2e||0);}
    const peakYear=Object.entries(tl).sort((a,b)=>b[1]-a[1])[0];
    const famLabel=th?{ar:'AR · ป่าและพื้นที่ปลูก',redd:'REDD+',ar_large:'AR ขนาดใหญ่',plantation:'สวนป่า',mangrove:'ป่าชายเลน',ifm:'IFM',agri_land:'พื้นที่เกษตร',perennial:'ไม้ยืนต้น',peat:'พีท',unknown:'ไม่ระบุ'}:{ar:'AR · forest & plantations',redd:'REDD+',ar_large:'AR large scale',plantation:'Plantation',mangrove:'Mangrove',ifm:'IFM',agri_land:'Agricultural land',perennial:'Perennials',peat:'Peatland',unknown:'Unstated'};
    const fig={forestPct:fmt(100*n.forest_area_ha/n.area_ha,1)+'%',areaKm2:fmt(n.area_ha/100,0)+(th?' ตร.กม.':' km²'),febApr:m,
      bandInd:fmt(100*Z95*Math.sqrt(n.forest_var_mg2)/n.forest_agb_mg,2),bandBlock:fmt(100*Z95*Math.sqrt(n.forest_blockvar_mg2)/n.forest_agb_mg,1),bandCorr:fmt(100*Z95*n.forest_sd_mg/n.forest_agb_mg,0),
      tverCount:fmt(tgo.national.projects,0),tverExpected:fmt(tgo.national.expected_tco2e_yr/1e6,2)+' M tCO₂e/yr',
      tverIssued:fmt(tgo.national.issued_tco2e,0)+' tCO₂e',tverWithIssue:fmt(tgo.national.projects_with_issuance,0)+' / '+fmt(tgo.national.projects,0),
      tverTop:topName+' ('+fmt(topPCode?topPCode[1].projects:0,0)+(th?' โครงการ)':' projects)'),
      tverRest:restLabel,tverSnapshot:tgo.snapshot,
      tverProgSplit:`${fmt(std,0)} / ${fmt(prem,0)}`,
      tverTopFam:(topFam?famLabel[topFam[0]]:topFam?topFam[0]:'—')+' · '+fmt(topFam?topFam[1]:0,0)+(th?' โครงการ':' projects'),
      tverTopDev:(topDev?topDev[0]:'—')+' · '+fmt(topDev?topDev[1].exp:0,0)+' tCO₂e/'+(th?'ปี':'yr'),
      tverPeakYear:peakYear?`${peakYear[0]} · ${fmt(peakYear[1]/1e3,1)}k tCO₂e`:'—'};
    body.querySelectorAll('[data-fig]').forEach(e=>e.textContent=fig[e.dataset.fig]??'—');
    // Bars to one linear scale: the ceiling spans the figure, so the floor and the central range are drawn at their true size.
    const half={bandInd:Math.sqrt(n.forest_var_mg2),bandBlock:Math.sqrt(n.forest_blockvar_mg2),bandCorr:n.forest_sd_mg},scale=270/half.bandCorr;
    body.querySelectorAll('[data-band]').forEach(e=>{const w=Math.max(2,half[e.dataset.band]*scale);e.setAttribute('x',320-w);e.setAttribute('width',2*w);});
    const mt=v=>v/1e6,rows=[
      ['absorb',th?'ป่าดูดซับ (GFW)':'Forests absorb (GFW)',mt(n.gfw_removals_mg_co2/s.gfwYears)],
      ['emit',th?'ป่าปล่อยจากการสูญเสียป่า (GFW)':'Forests release through loss (GFW)',mt(n.gfw_emissions_mg_co2e/s.gfwYears)],
      ['emit',th?'ไฟทุกประเภท CO₂ ขั้นต้น (GFED)':'All fires, gross CO₂ (GFED)',mt(n.fire_co2_t)],
      ['emit',th?'เชื้อเพลิงฟอสซิล (ODIAC)':'Fossil fuels (ODIAC)',mt(n.fossil_c_t*C_TO_CO2)]];
    const max=Math.max(...rows.map(r=>r[2]));
    const head=k=>`<p class="ab-side ${k}">${k==='absorb'?(th?'ด้านดูดซับ':'Taken up'):(th?'ด้านปล่อย · แสดงคู่กัน ไม่นำมาบวกกัน':'Released · shown side by side, never added')}</p>`;
    body.querySelector('#abLedger').innerHTML=head('absorb')+rows.map((r,i)=>(i===1?head('emit'):'')+`<div class="ab-row ${r[0]}"><span>${r[1]}</span><i style="width:${(100*r[2]/max).toFixed(1)}%"></i><b>${fmt(r[2],1)}</b></div>`).join('')+
      `<p class="ab-net">${th?'สุทธิของป่าตาม GFW':'Forest net, GFW'}: <b>${fmt(mt(n.gfw_net_mg_co2e/s.gfwYears),1)}</b> ${th?'ล้านตัน CO₂e ต่อปี (ติดลบ = ดูดซับสุทธิ)':'Mt CO₂e per year (negative = net sink)'} · ${th?'คาร์บอนสะสมในป่า':'forest carbon stock'} <b>${fmt(n.forest_agb_mg*AGB_TO_CO2E/1e9,2)}</b> ${th?`พันล้านตัน CO₂e (${s.cciYear})`:`billion t CO₂e (${s.cciYear})`}</p>`;
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
