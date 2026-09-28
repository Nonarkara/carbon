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
    const iss=p.issuances.length?p.issuances.map(i=>`${n0(i.tco2e)} (${esc(date(i.certified))})`).join(', '):esc(t('tverNoIssue'));
    return `<li class="tver-item"><a href="${esc(p.url)}" target="_blank" rel="noopener"><b>${esc(t('tverReg'))} ${esc(p.reg)}</b> ${esc(name(p))} ↗</a>
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
    if(nat)h.push(marketHTML());
    return h.join('');
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
    return `<div class="tver-check"><h3>${esc(t('tverCheckTitle'))}</h3><p>${esc(t('tverCheckText').replace('{p}',names).replace('{n}',list.length))}</p>${source()}${list.length?listHTML(list,4):''}<p class="hint">${esc(t('tverCheckLimit'))}</p></div>`;
  }
  const byProvince=pc=>D?D.provinces[pc]:null;
  return {ready,section,overlapHTML,byProvince,data:()=>D};
}
