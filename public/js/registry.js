// TGO T-VER registry snapshot (forestry & agriculture). Registry facts sit beside satellite estimates, never mixed:
// expected = developer's ex-ante estimate at registration; issued = credits TGO has certified. Province-level only.
import {polygonsOf,polygonContains} from './ledger.js';

export const TVER_CLASSES=[[0,'#f3efe0'],[1,'#d9c98f'],[2,'#b89b3c'],[5,'#7a6200'],[10,'#3d3100']];

export function initRegistry({t,fmt,getLang}){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let D=null,geo=null;
  const ready=Promise.all([fetch('data/tgo/tver-forestry.json'),fetch('data/ledger/provinces.geojson')].map(p=>p.then(r=>{if(!r.ok)throw Error('registry');return r.json();})))
    .then(([d,g])=>{D=d;geo=g;return d;});
  const th=()=>getLang()==='th';
  const date=s=>s?new Intl.DateTimeFormat(th()?'th-TH':'en-GB',{dateStyle:'medium'}).format(new Date(s+'T00:00:00')):'—';
  const n0=v=>v==null?'—':fmt(v,0);
  const projectsIn=pc=>D.projects.filter(p=>p.provinces.includes(pc));
  const name=p=>th()?p.name_th:(p.name_en||p.name_th);
  const family=p=>p.families.map(f=>t('fam_'+f)).join(', ')||t('fam_unknown');

  function projectRow(p){
    const multi=p.provinces.length>1?` · ${esc(t('tverMulti').replace('{n}',p.provinces.length))}`:'';
    const hasIss=p.issuances.length>0;
    const iss=hasIss?p.issuances.map(i=>`${n0(i.tco2e)} (${esc(date(i.certified))})`).join(', '):esc(t('tverNoIssue'));
    const badge=hasIss?`<span class="tver-badge-issued">✓ ${esc(t('tverIssuedBadge'))}: ${n0(p.issued_tco2e)} tCO₂e</span>`:'';
    return `<li class="tver-item ${hasIss?'with-issuance':''}"><div class="tver-item-head"><a href="${esc(p.url)}" target="_blank" rel="noopener"><b>${esc(t('tverReg'))} ${esc(p.reg)}</b> ${esc(name(p))} ↗</a>${badge}</div>
<small>${esc(p.developer)} · ${esc(family(p))} · ${esc(p.methodology||t('fam_unknown'))} · ${esc(th()?p.status:(p.status_en||p.status))}${multi}</small>
<dl><dt>${esc(t('tverExpected'))}</dt><dd>${n0(p.expected_tco2e_yr)} tCO₂e/${esc(t('yr'))}</dd><dt>${esc(t('tverIssued'))}</dt><dd>${iss}</dd><dt>${esc(t('tverCrediting'))}</dt><dd>${esc(date(p.credit_start))} → ${esc(date(p.credit_end))}</dd></dl>${p.province_basis==='reviewed'?`<p class="hint">${esc(t('tverReviewed'))}</p>`:''}</li>`;
  }
  function listHTML(list,limit=6){
    const sorted=[...list].sort((a,b)=>(b.issued_tco2e-a.issued_tco2e)||((b.expected_tco2e_yr||0)-(a.expected_tco2e_yr||0)));
    const head=sorted.slice(0,limit).map(projectRow).join(''),rest=sorted.slice(limit);
    return `<ol class="tver-list">${head}</ol>`+(rest.length?`<details class="tver-more"><summary>${esc(t('tverAll').replace('{n}',sorted.length))}</summary><ol class="tver-list">${rest.map(projectRow).join('')}</ol></details>`:'');
  }
  function marketHTML(){
    const rows=D.market.for_agr;if(!rows.length)return '';
    return `<div class="lrow"><p class="lmeta">${esc(t('tverMarket'))}</p><div class="table-scroll"><table class="tver-market"><thead><tr><th>${esc(t('year'))}</th><th>${esc(t('tverVolume'))}</th><th>${esc(t('tverAvg'))}</th><th>${esc(t('tverRange'))}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.year}${r.year===Number(D.snapshot.slice(0,4))?'*':''}</td><td>${n0(r.volume_tco2e)}</td><td>${fmt(r.avg_thb,0)}</td><td>${fmt(r.min_thb,0)}–${fmt(r.max_thb,0)}</td></tr>`).join('')}</tbody></table></div><p class="hint">${esc(t('tverMarketNote'))}</p></div>`;
  }
  const source=()=>`<p class="lmeta">TGO · T-VER FOR&amp;AGR · ${esc(t('tverSnapshot'))} ${esc(date(D.snapshot))} · <a href="${esc(D.source.registry)}" target="_blank" rel="noopener">tver.tgo.or.th ↗</a></p>`;

  // Ledger block for a province ('TH' = nation). Boxes get a pointer to provinces: the registry has no coordinates.
  function section(pcode){
    if(!D)return '';
    const h=[`<h3 class="lside">${esc(t('tverSide'))}</h3>`];
    if(!pcode){h.push(`<div class="lrow unavailable"><p class="hint">${esc(t('tverBoxNote'))}</p></div>`);return h.join('');}
    const nat=pcode==='TH',agg=nat?D.national:D.provinces[pcode],list=nat?D.projects:projectsIn(pcode);
    h.push(`<div class="lrow tver-summary">${source()}<dl class="cross"><dt>${esc(t('tverCount'))}</dt><dd>${n0(agg.projects)}</dd><dt>${esc(t('tverExpectedSum'))}</dt><dd>${n0(agg.expected_tco2e_yr)}</dd><dt>${esc(t('tverIssuedSum'))}</dt><dd>${n0(agg.issued_tco2e)}</dd><dt>${esc(t('tverWithIssue'))}</dt><dd>${n0(nat?D.national.projects_with_issuance:list.filter(p=>p.provinces.length===1&&p.issued_tco2e>0).length)}</dd></dl>
${nat?`<p class="hint">${esc(t('tverNationNote').replace('{m}',D.multi.projects).replace('{u}',D.unlocated.projects))}</p>`:(agg.multi_province_projects?`<p class="hint">${esc(t('tverMultiNote').replace('{n}',agg.multi_province_projects))}</p>`:'')}
<p class="hint">${esc(t('tverDefs'))}</p></div>`);
    if(list.length)h.push(listHTML(list));else h.push(`<p class="hint">${esc(t('tverNone'))}</p>`);
    if(nat){h.push(portfolioHTML());h.push(marketHTML());}
    return h.join('');
  }
  // National portfolio analytics: what TGO wants to see at a glance — pipeline health, methodology coverage,
  // top developers, issuance timeline. Derived once from the snapshot; numbers reconcile with D.national.
  function portfolioHTML(){
    const today=D.snapshot;
    const issued=D.projects.filter(p=>p.issued_tco2e>0);
    const std=D.projects.filter(p=>p.program==='standard');
    const prem=D.projects.filter(p=>p.program==='premium');
    const single=D.projects.filter(p=>p.provinces.length===1);
    const poa=D.projects.filter(p=>p.form==='poa');
    const byFam={};for(const p of D.projects)for(const f of (p.families.length?p.families:['unknown']))byFam[f]=(byFam[f]||0)+1;
    const famEntries=Object.entries(byFam).sort((a,b)=>b[1]-a[1]);
    const famMax=Math.max(...famEntries.map(([,c])=>c),1);
    const bySize={};for(const p of D.projects){const k=p.size||'unspecified';bySize[k]=(bySize[k]||0)+1;}
    const sizeEntries=Object.entries(bySize).sort((a,b)=>b[1]-a[1]);
    const sizeMax=Math.max(...sizeEntries.map(([,c])=>c),1);
    const byDev={};for(const p of D.projects){const k=p.developer||'—';if(!byDev[k])byDev[k]={n:0,exp:0,iss:0};byDev[k].n++;byDev[k].exp+=p.expected_tco2e_yr||0;byDev[k].iss+=p.issued_tco2e||0;}
    const topDev=Object.entries(byDev).sort((a,b)=>b[1].exp-a[1].exp).slice(0,5);
    const timeline={};for(const p of D.projects)for(const i of p.issuances){const y=i.certified?i.certified.slice(0,4):null;if(!y)continue;timeline[y]=(timeline[y]||0)+(i.tco2e||0);}
    const tlEntries=Object.entries(timeline).filter(([y])=>y>='2016'&&y<=today.slice(0,4)).sort();
    const tlMax=Math.max(...tlEntries.map(([,v])=>v),1);
    const issuedPct=D.projects.length?(issued.length/D.projects.length*100):0;
    const pipeline=`<div class="lrow tver-portfolio"><p class="lmeta">${esc(t('tverPortfolioPipeline'))}</p><div class="tver-pipeline-bar"><i style="width:${issuedPct.toFixed(1)}%"></i></div><dl class="cross"><dt>${esc(t('tverPortfolioIssued'))}</dt><dd>${n0(issued.length)} / ${n0(D.projects.length)} (${issuedPct.toFixed(1)}%)</dd><dt>${esc(t('tverPortfolioPipelineIss'))}</dt><dd>${n0(D.national.issued_tco2e)} tCO₂e</dd><dt>${esc(t('tverPortfolioPipelineExpected'))}</dt><dd>${n0(D.national.expected_tco2e_yr)} tCO₂e/${esc(t('yr'))}</dd><dt>${esc(t('tverPortfolioStandard'))}</dt><dd>${n0(std.length)}</dd><dt>${esc(t('tverPortfolioPremium'))}</dt><dd>${n0(prem.length)}</dd><dt>${esc(t('tverPortfolioSingle'))}</dt><dd>${n0(single.length)}</dd><dt>${esc(t('tverPortfolioPoa'))}</dt><dd>${n0(poa.length)}</dd></dl><p class="hint">${esc(t('tverPipelineNote'))}</p></div>`;
    const famBars=famEntries.map(([f,c])=>`<div class="share"><span>${esc(t('fam_'+f))}</span><i style="width:${(100*c/famMax).toFixed(1)}%;background:var(--ink-mid)"></i><b>${fmt(c,0)}</b></div>`).join('');
    const family=`<div class="lrow tver-portfolio"><p class="lmeta">${esc(t('tverPortfolioFamilies'))}</p>${famBars}<p class="hint">${esc(t('tverFamiliesNote'))}</p></div>`;
    const sizeLabel=s=>{if(th())return s;return s.replace('ขนาดเล็กมาก','Micro').replace('ขนาดเล็ก','Small').replace('ขนาดใหญ่','Large').replace('ไม่ระบุ','Unspecified');};
    const sizeBars=sizeEntries.map(([s,c])=>`<div class="share"><span>${esc(sizeLabel(s))}</span><i style="width:${(100*c/sizeMax).toFixed(1)}%;background:var(--ink-mid)"></i><b>${fmt(c,0)}</b></div>`).join('');
    const sizes=`<div class="lrow tver-portfolio"><p class="lmeta">${esc(t('tverPortfolioSizes'))}</p>${sizeBars}<p class="hint">${esc(t('tverSizesNote'))}</p></div>`;
    const devRows=topDev.map(([n,v])=>`<tr><td>${esc(n)}</td><td>${n0(v.n)}</td><td>${n0(v.exp)}</td><td>${n0(v.iss)}</td></tr>`).join('');
    const devs=`<div class="lrow tver-portfolio"><p class="lmeta">${esc(t('tverPortfolioDevelopers'))}</p><div class="table-scroll"><table class="tver-market"><thead><tr><th>${esc(t('tverDeveloper'))}</th><th>${esc(t('tverCount'))}</th><th>${esc(t('tverExpectedSum'))}</th><th>${esc(t('tverIssuedSum'))}</th></tr></thead><tbody>${devRows}</tbody></table></div><p class="hint">${esc(t('tverDevelopersNote'))}</p></div>`;
    const years=tlEntries.map(([y,v])=>`<div class="share"><span>${y}</span><i style="width:${(100*v/tlMax).toFixed(1)}%;background:var(--accent)"></i><b>${n0(v)}</b></div>`).join('');
    const tl=tlEntries.length?`<div class="lrow tver-portfolio"><p class="lmeta">${esc(t('tverPortfolioTimeline'))}</p>${years}</div>`:'';
    return [pipeline,family,sizes,devs,tl].join('');
  }
  // Provinces touched by an imported boundary (vertices and centre), for the double-counting check.
  function provincesOf(geojson){
    const polys=polygonsOf(geojson),pts=polys.flatMap(p=>p[0]);
    const c=pts.reduce((a,[x,y])=>[a[0]+x/pts.length,a[1]+y/pts.length],[0,0]);pts.push(c);
    return geo.features.filter(f=>{const fp=polygonsOf(f);return pts.some(([x,y])=>polygonContains(fp,x,y));}).map(f=>f.properties);
  }
  function overlapHTML(geojson){
    if(!D||!geojson)return '';
    const provs=provincesOf(geojson);
    if(!provs.length)return `<div class="notice"><p>${esc(t('tverOverlapNone'))}</p></div>`;
    const list=[...new Map(provs.flatMap(p=>projectsIn(p.pcode)).map(p=>[p.key,p])).values()];
    const names=provs.map(p=>th()?p.name_th:p.name_en).join(', ');
    const totExp=list.reduce((a,p)=>a+(p.expected_tco2e_yr||0),0);
    const totIss=list.reduce((a,p)=>a+(p.issued_tco2e||0),0);
    const withIssCount=list.filter(p=>p.issued_tco2e>0).length;
    const stats=list.length?`<p class="tver-overlap-stats">${esc(t('tverOverlapStats').replace('{p}',names).replace('{exp}',n0(totExp)).replace('{iss}',n0(totIss)).replace('{issN}',n0(withIssCount)))}</p>`:'';
    return `<div class="tver-check"><h3>${esc(t('tverCheckTitle'))}</h3><p>${esc(t('tverCheckText').replace('{p}',names).replace('{n}',list.length))}</p>${stats}${source()}${list.length?listHTML(list,4):''}<p class="hint tver-rule">${esc(t('tverRuleNotice'))}</p><p class="hint">${esc(t('tverCheckLimit'))}</p></div>`;
  }
  const byProvince=pc=>D?D.provinces[pc]:null;
  return {ready,section,overlapHTML,byProvince,data:()=>D,provincesOf};
}
