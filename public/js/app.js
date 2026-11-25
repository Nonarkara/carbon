import {calculate,FACTORS,plotEstimate,METHOD} from './carbon.js';
import {createDraft,FORM_FIELDS,MAX_SESSION} from './assessment-session.js';
import {loadJSON} from './data-load.js';
import {parseCSV,readFile} from './imports.js';
import {assessmentCSVRows,csvText} from './assessment-export.js';
import {createEvidenceTask} from './evidence-task.js';
const evidenceTask=createEvidenceTask();
import {t,fmt,setLang,getLang} from './i18n.js';
import {initLandscape} from './landscape.js';
import {initWorld} from './world.js';
import {initAbout} from './about.js';
import {initRegistry} from './registry.js';
import {initDigest} from './digest.js';
import {initGeocode} from './geocode.js';
import {initMeasure} from './measure.js';
import {initUrban,urbanToggle,urbanShown} from './urban.js';
const initialHash=location.hash;
// Remove all fragments before locale/history writers run; only validated public state is restored.
if(initialHash){const u=new URL(location.href);u.hash='';history.replaceState(null,'',u);}
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const PROVINCE_EN={'สระบุรี':'Saraburi','กาญจนบุรี':'Kanchanaburi'};
 const provName=r=>getLang()==='th'?r.province_th:PROVINCE_EN[r.province_th]||r.province_th;
 const state={tab:'carbon',boundary:null,boundaryFile:null,plots:null,plotFile:null,rows:null,result:null,input:null,sample:false,plotUsed:false,sources:[],province:[],version:'unavailable',sourceStatus:'pending',provinceStatus:'pending'};
// When enlarged text cannot share the phone with the map, the same readouts travel
// into the existing reading panes. Nothing is copied, abbreviated or discarded.
const summaryHomes=[...document.querySelectorAll('.kpis[data-kpi]')].map(node=>{const anchor=document.createComment('summary home');node.before(anchor);return {node,anchor};});
const textMeasure=document.createElement('span');textMeasure.setAttribute('aria-hidden','true');textMeasure.style.cssText='position:absolute;visibility:hidden;pointer-events:none;width:1em;height:1em;font-size:1rem;contain:strict';document.body.append(textMeasure);
function syncSummaryPlacement(){
 const large=innerWidth<=700&&textMeasure.getBoundingClientRect().height>=23;
 document.body.toggleAttribute('data-large-summary',large);
 for(const {node,anchor} of summaryHomes){
  if(!large){if(node.previousSibling!==anchor)anchor.after(node);continue;}
  if(node.dataset.kpi==='carbon')document.querySelector('[data-panel="carbon"]').prepend(node);
  else document.querySelector(`[data-panel="${state.tab==='carbon'?'project':state.tab}"]`)?.append(node);
 }
}
new ResizeObserver(syncSummaryPlacement).observe(textMeasure);window.addEventListener('resize',syncSummaryPlacement);syncSummaryPlacement();
const map=L.map('map',{zoomControl:false,minZoom:5,maxZoom:18,zoomSnap:.25}).setView([13.3,101],5.7);
// Data and language can change chrome height without a window resize. Resize the map
// only when its actual container changes; ordinary HUD updates must not pan the view.
let observedMapSize='';
new ResizeObserver(([entry])=>{
 const {width,height}=entry.contentRect,key=`${width}:${height}`;
 if(key===observedMapSize)return;observedMapSize=key;
 if(width>0&&height>0)map.invalidateSize({pan:false});
}).observe(map.getContainer());
L.control.zoom({position:'bottomright'}).addTo(map);
const tiles={dark:L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}),sat:L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:18,attribution:'Esri, Maxar, Earthstar Geographics'})};
tiles.dark.addTo(map);let drawn=null;
Object.values(tiles).forEach(layer=>layer.on('tileerror',()=>{$('#tileStatus').textContent=t('tileError');}));
function message(text){$('#message').textContent=text;$('#message').hidden=!text;}
function error(err){const code=String(err.message||err).split(':').at(-1);if(code==='cancelled')return;const explanation={
 validationTimeout:['ตรวจไฟล์นานเกินกำหนด งานเดิมยังอยู่ ลองไฟล์ที่ลดจำนวนจุดแล้ว','Validation timed out. Existing work is retained; retry a simplified file'],workerUnavailable:['เบราว์เซอร์ไม่รองรับการตรวจไฟล์นี้ งานเดิมยังอยู่ กรุณาใช้เบราว์เซอร์รุ่นปัจจุบัน','File validation is unavailable in this browser. Existing work is retained; use a current browser'],projectSize:['ไฟล์โครงการต้องไม่เกิน 16 MB','Project file must be at most 16 MB'],projectFile:['ไฟล์โครงการไม่ถูกต้อง งานเดิมยังอยู่','Invalid project file. Existing work is retained'],projectMethod:['รุ่นระเบียบวิธีไม่รองรับ งานเดิมยังอยู่','Unsupported methodology version. Existing work is retained'],fileSize:['ไฟล์ต้องมีขนาดไม่เกิน 2 MB','File must be at most 2 MB'],coordinates:['พิกัดต้องเป็น WGS84 [ลองจิจูด, ละติจูด] ในประเทศไทย','Coordinates must be WGS84 [longitude, latitude] in Thailand'],overlap:['รูปหลายเหลี่ยมซ้อนกัน ห้ามนับพื้นที่ซ้ำ','Polygons overlap; double counting is prohibited'],fireAssessment:['ต้องประเมินไฟป่าก่อนคำนวณ','Assess canopy fire before calculation'],period:['วันที่ติดตามผลต้องอยู่หลังวันที่ฐาน','Monitoring date must follow baseline date'],duplicateTree:['รหัสต้นไม้ซ้ำในแปลงเดียวกัน','Duplicate tree ID within a plot'],csvHeaders:['ตรวจชื่อคอลัมน์และจำนวนแถวใน CSV','Check required CSV headers and row count'],sampleArea:['พื้นที่สำรวจมากกว่าพื้นที่โครงการ','Sample area exceeds project area'],selfIntersection:['ขอบเขตตัดกันเอง','Boundary self-intersects'],crs:['แปลงเป็น GeoJSON WGS84 ก่อนนำเข้า ไม่รับ CRS อื่น','Reproject to WGS84 GeoJSON; other CRS declarations are not accepted']};message(t('invalid')+' — '+(explanation[code]?.[getLang()==='th'?0:1]||code));}
function tab(name){document.querySelector('.more-nav').open=false;document.querySelector('.reference-menu').open=false;document.querySelector('.advanced-tools').open=false;if(name==='about'){showAbout();return;}delete document.body.dataset.about;$('#about').hidden=true;$('#aboutTab').setAttribute('aria-pressed','false');state.tab=name;syncSummaryPlacement();document.body.dataset.mode=name;document.querySelectorAll('[data-panel]').forEach(e=>e.hidden=e.dataset.panel!==name);document.querySelectorAll('.lenses [data-tab]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.tab===name)));$('#panelTitle').textContent=t(name);$('#step').textContent=`0${['carbon','project','calculate','evidence','sources'].indexOf(name)+1} / 05`;document.querySelectorAll('[data-kpi]').forEach(e=>e.hidden=e.dataset.kpi!==(name==='carbon'?'carbon':'project'));document.body.dataset.view='rail';setNav();$('#tabBody').scrollTop=0;map.invalidateSize();message('');}
function redrawBoundary(){if(drawn)map.removeLayer(drawn);drawn=null;if(!state.boundary)return;drawn=L.geoJSON(state.boundary.geojson,{style:{color:'#ffcc00',weight:3,fillColor:'#ffcc00',fillOpacity:.16}}).addTo(map);map.fitBounds(drawn.getBounds(),{padding:[40,40],maxZoom:15});}
let dirty=false,sessionRevision=0;
function invalidate(){dirty=true;state.result=null;state.input=null;$('#result').replaceChildren();summary();}
function clearPlots(){state.plots=null;state.rows=null;state.plotFile=null;if(state.plotUsed){$('#current').value='';$('#inputSource').value='';}state.plotUsed=false;$('#plotFile').value='';$('#usePlots').disabled=true;$('#plotResult').replaceChildren();}
function summary(){
 for(const [id,ready] of [['areaValue',!!state.boundary],['stockValue',!!state.result],['periodValue',!!state.result]])$('#'+id).dataset.status=ready?'ready':'pending';
 $('#areaValue').textContent=state.boundary?`${fmt(state.boundary.rai)} ${t('rai')}`:t('noBoundary');
 $('#stockValue').textContent=state.result?fmt(state.result.after):t('noStock');
 $('#periodValue').textContent=state.result?fmt(state.result.net):'—';
 $('#stockValue').nextElementSibling.querySelector('small').textContent=state.result?`${state.sample?t('sampleBadge'):t('manual')} · ${state.input.end}`:t('stockHint');
 $('#periodValue').nextElementSibling.querySelector('small').textContent=state.result?`${state.input.start} → ${state.input.end} · tCO₂e`:t('periodHint');
 $('#sampleNote').hidden=!state.sample;$('#exportBoundary').disabled=!state.boundary;
 $('#boundaryInfo').hidden=!state.boundary;
 if(state.boundary){$('#boundaryInfo').textContent=`${t('boundaryReady')} · ${fmt(state.boundary.hectares)} ${t('ha')} / ${fmt(state.boundary.rai)} ${t('rai')} · ${state.boundary.featureCount} ${t('features')} · ${state.boundaryFile?.name||t('sampleBadge')}`;}
 $('#mapLabel').textContent=state.boundary?`${state.sample?t('sampleBadge'):t('imported')} · ${fmt(state.boundary.rai)} ${t('rai')}`:t('thailand');
 renderRegistry();
}
function renderRegistry(){
 const el=$('#registryCheck');
 if(!state.boundary||!el){if(el){el.hidden=true;el.replaceChildren();}return;}
 const html=registry.overlapHTML(state.boundary.geojson);
 if(!html){el.hidden=true;el.replaceChildren();return;}
 el.innerHTML=html;el.hidden=false;
}
function formState(){const group=$('#group').value;return {start:$('#start').value,end:$('#end').value,unit:$('#unit').value,previous:$('#previous').value,current:$('#current').value,group,...FACTORS[group],burnedPercent:$('#burnedPercent').value,canopyDeath:$('#canopyDeath').value,fireEmissions:$('#fireEmissions').value,source:$('#inputSource').value.trim(),fireSource:$('#fireSource').value.trim()};}
function fields(){const f=FACTORS[$('#group').value];$('#factorValue').textContent=`${f.r} / ${f.cf}`;$('#factorFields').hidden=$('#unit').value==='co2';$('#fireInput').hidden=!(Number($('#burnedPercent').value)>5&&$('#canopyDeath').value==='yes');}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message(t('saved'));}
function assessment(){return {schemaVersion:1,appVersion:state.version,exportedAt:new Date().toISOString(),language:getLang(),projectName:$('#projectName').value.trim(),status:state.sample?'illustrative-unverified-estimate':'user-input-unverified-estimate',methodology:METHOD,inputs:state.input,result:state.result,boundary:state.boundary,boundaryProvenance:state.boundaryFile,plotEvidence:state.plotUsed?{estimate:state.plots,rows:state.rows,file:state.plotFile}:null,uncertainty:null,aiModel:null,issuedCredits:null,tverRegistryContext:state.boundary?registry.contextFor(state.boundary.geojson):null,limitations:{th:'ต้องตรวจสิทธิที่ดิน คุณสมบัติโครงการ ความไม่แน่นอน และทวนสอบก่อนยื่นรับรอง',en:'Land rights, eligibility, uncertainty and external verification remain required.'}};}
function renderResult(){if(!state.result)return;const r=state.result;$('#result').innerHTML=`<div class="result-box"><b>${esc(state.sample?t('sampleBadge'):t('result'))}</b><div class="result-value">${fmt(r.net)} <small>tCO₂e</small></div><p>${esc(state.input.start)} → ${esc(state.input.end)}</p><dl><dt>${t('previous')}</dt><dd>${fmt(r.before)}</dd><dt>${t('current')}</dt><dd>${fmt(r.after)}</dd><dt>PE</dt><dd>− ${fmt(r.pe)}</dd><dt>${t('annual')}</dt><dd>${fmt(r.annualAverage)}</dd></dl><p class="hint">${t('zeroLeak')}</p><code>CSEQ = CTT(t) − CTT(i) − PE − GHG_LEAK</code><p><a href="bible.html?lang=${getLang()}#project-change" target="_blank" rel="noopener">${getLang()==='th'?'ดูวิธีคำนวณ + แผนภาพ ↗':'Calculation explained + diagram ↗'}</a></p><p class="hint">${t('trace')}: ${esc(state.input.source)}</p><p class="hint">${t('noUncertainty')}</p>${r.net<0?`<p class="warning">${t('loss')}</p>`:''}${r.sizeScreen==='review-large-project'?`<p class="warning">${t('large')}</p>`:''}<div class="actions"><button class="btn" id="exportJSON">${t('exportJSON')}</button><button class="btn" id="exportCSV">${t('exportCSV')}</button></div></div>`;
 $('#exportJSON').onclick=()=>download('forest-carbon-assessment.json',JSON.stringify(assessment(),null,2),'application/json');
 $('#exportCSV').onclick=()=>download('forest-carbon-results.csv',csvText(assessmentCSVRows(assessment())),'text/csv;charset=utf-8');
}
function renderPlots(){if(!state.plots)return;const p=state.plots;$('#plotResult').innerHTML=`<div class="notice"><b>${fmt(p.agbTonnes)} t AGB</b><p>${fmt(p.densityTonnesHa)} t/ha · ${p.treeCount} ${t('trees')} · ${p.plotCount} ${t('plots')}</p><small>${esc(state.plotFile?.name)} · ${t('imported')}</small></div>`;}
function renderSources(){
 $('#sourceList').innerHTML=state.sourceStatus==='unavailable'?(getLang()==='th'?'รายการแหล่งข้อมูลไม่พร้อมใช้ กรุณาลองใหม่เมื่อออนไลน์':'Source catalogue unavailable. Retry when connected.'):state.sources.map(s=>`<article class="source-item"><h3>${esc(s.name[getLang()])}</h3><p>${esc(s.use[getLang()])}</p><small>${esc(s.date)} · ${esc(s.tier[getLang()])}</small><p><a href="${esc(s.url)}" target="_blank" rel="noopener">${t('viewSource')} ↗</a></p></article>`).join('');
  $('#provinceRows').innerHTML=state.province.map(r=>`<tr><td>${esc(provName(r))}</td><td>${r.year_be}</td><td>${fmt(r.forest_area_rai)}</td></tr>`).join('');
  const latest=state.province.filter(r=>r.year_ce===2024);$('#provincePreview').innerHTML=state.provinceStatus==='unavailable'?(getLang()==='th'?'ข้อมูลอ้างอิงจังหวัดไม่พร้อมใช้':'Province reference unavailable'):latest.map(r=>`<dl><dt>${esc(provName(r))}</dt><dd>${fmt(r.forest_area_rai)} ${t('rai')}</dd></dl>`).join('')+`<small>2024 / 2567 · data.go.th · ${t('reference')}</small>`;
}
async function example(){const revision=++sessionRevision;const res=await fetch('data/example-boundary.geojson');if(!res.ok)throw Error('example');const data=await res.json();if(revision!==sessionRevision)return;message(getLang()==='th'?'กำลังตรวจขอบเขต…':'Validating boundary…');const boundary=await evidenceTask.run('boundary',data);if(revision!==sessionRevision)return;clearPlots();state.boundary=boundary;state.boundaryFile={name:'example-boundary.geojson',tier:'illustrative'};state.sample=true;$('#projectName').value=getLang()==='th'?'ตัวอย่างการคำนวณ — ไม่ใช่โครงการจริง':'Illustrative assessment — not a real project';Object.entries({start:'2021-01-01',end:'2026-01-01',previous:'1000',current:'1100',unit:'agb',group:'general',burnedPercent:'0',canopyDeath:'no',inputSource:'Illustrative arithmetic example / ตัวอย่างสมมติ',fireEmissions:'',fireSource:''}).forEach(([k,v])=>$('#'+k).value=v);invalidate();fields();redrawBoundary();summary();message(t('sampleText'));}
// Unified bottom-nav state: for any given (view, tab) at most one button is pressed.
// Buttons with data-view="rail" inherit the active tab; data-view="map" and "world" are solo;
// the about tab is the inverse — all buttons are released. The F05 audit caught cases where
// the visible pane disagreed with the pressed button.
const setNav=()=>{
  const aboutOpen=document.body.dataset.about==='true';
  document.querySelectorAll('.bottom-nav button').forEach(b=>{
    let pressed=false;
    if(aboutOpen)pressed=false;
    else if(b.dataset.view==='rail')pressed=document.body.dataset.view==='rail'&&b.dataset.tab===state.tab;
    else if(b.dataset.view==='map')pressed=document.body.dataset.view==='map';
    else if(b.dataset.view==='world')pressed=document.body.dataset.view==='world';
    b.setAttribute('aria-pressed',String(pressed));
  });
};
document.querySelectorAll('[data-tab]').forEach(e=>e.addEventListener('click',()=>tab(e.dataset.tab)));
document.querySelector('.bottom-nav [data-view=map]').onclick=()=>{document.body.dataset.view='map';setNav();map.invalidateSize();};
document.querySelectorAll('[data-lang]').forEach(e=>e.onclick=()=>{setLang(e.dataset.lang);$('#panelTitle').textContent=t(state.tab);summary();fields();renderResult();renderPlots();renderSources();landscape.render();world.render();$('#standardsLink').href=`research-${getLang()}.html#standards`;if(document.body.dataset.about)about.show().catch(err=>error(err));message('');document.querySelectorAll('.flow span').forEach((el,i)=>el.textContent=(getLang()==='th'?['ดาวเทียม + แปลงสำรวจ','แบบจำลองมวลชีวภาพ','ตรวจสอบด้วยแปลงอิสระ','รับรองวิธี + ทวนสอบ']:['Satellite + plots','Biomass model','Independent validation','Method approval + verification'])[i]);});
$('#base').onchange=()=>{Object.values(tiles).forEach(l=>map.removeLayer(l));tiles[$('#base').value].addTo(map);document.body.dataset.basemap=$('#base').value;$('#tileStatus').textContent='';};
$('#fit').onclick=()=>{if(drawn)map.fitBounds(drawn.getBounds(),{padding:[30,30]});else landscape.fitThailand();};
$('#example').onclick=async()=>{const button=$('#example'),submit=$('#calculationForm [type=submit]');button.disabled=true;submit.disabled=true;button.textContent=getLang()==='th'?'กำลังโหลดตัวอย่าง…':'Loading example…';try{await example();}catch(e){error(e);}finally{button.disabled=false;submit.disabled=false;button.textContent=t('example');}};
$('#reset').onclick=()=>{evidenceTask.cancel();landscape.clearProjectSelection();sessionRevision++;cancelHash();state.boundary=null;state.boundaryFile=null;state.sample=false;clearPlots();invalidate();if(drawn){map.removeLayer(drawn);drawn=null;}$('#calculationForm').reset();$('#projectName').value='';$('#boundaryFile').value='';$('#equationConfirmed').checked=false;fields();summary();map.setView([13.3,101],5.7);message(t('resetDone'));dirty=false;};
$('#boundaryFile').onchange=async e=>{const revision=++sessionRevision;if(!e.target.files[0])return;try{const f=await readFile(e.target.files[0]);if(revision!==sessionRevision)return;message(getLang()==='th'?'กำลังตรวจขอบเขต…':'Validating boundary…');const b=await evidenceTask.run('boundary',JSON.parse(f.text));if(revision!==sessionRevision)return;clearPlots();state.boundary=b;state.boundaryFile={name:f.name,sha256:f.sha256,tier:'user-import',importedAt:new Date().toISOString()};invalidate();redrawBoundary();summary();message(t('boundaryReady'));}catch(err){if(revision===sessionRevision)error(err);}finally{e.target.value='';}};
$('#exportBoundary').onclick=()=>{if(state.boundary)download('assessment-boundary.geojson',JSON.stringify(state.boundary.geojson,null,2),'application/geo+json');};
$('#calculationForm').addEventListener('input',e=>{
 sessionRevision++;evidenceTask.cancel();message('');invalidate();
 if(e.target.id==='unit'){$('#previous').value='';$('#current').value='';$('#inputSource').value='';state.plotUsed=false;message(getLang()==='th'?'เปลี่ยนหน่วยแล้ว กรุณากรอกค่าฐานและค่าติดตามผลใหม่':'Unit changed. Enter baseline and monitoring values again.');}
 if(e.target.id==='group'&&state.plotUsed){$('#current').value='';$('#inputSource').value='';state.plotUsed=false;message(getLang()==='th'?'เปลี่ยนกลุ่มพรรณไม้แล้ว กรุณาระบุค่ามวลชีวภาพที่เหมาะสม':'Tree group changed. Supply an appropriate biomass estimate.');}
 if(e.target.id==='current')state.plotUsed=false;
 fields();
});
$('#calculationForm').onsubmit=e=>{e.preventDefault();try{invalidate();const input=formState();if(!input.source)throw Error('missing:source');const result=calculate(input);if(result.fireApplies&&!input.fireSource)throw Error('missing:fireSource');state.input=input;state.result=result;summary();renderResult();message('');}catch(err){error(err);}};
$('#plotFile').onchange=async e=>{const revision=++sessionRevision;if(!e.target.files[0])return;try{if(!state.boundary)throw Error(t('needBoundary'));if(!$('#equationConfirmed').checked)throw Error(t('confirmEquation'));const f=await readFile(e.target.files[0]),rows=parseCSV(f.text),estimate=plotEstimate(rows,state.boundary.hectares);if(revision!==sessionRevision)return;clearPlots();invalidate();state.rows=rows;state.plots=estimate;state.plotFile={name:f.name,sha256:f.sha256,tier:'user-import',importedAt:new Date().toISOString()};$('#usePlots').disabled=false;renderPlots();message('');}catch(err){if(revision===sessionRevision)error(err);}finally{e.target.value='';}};
$('#equationConfirmed').onchange=()=>{evidenceTask.cancel();message('');sessionRevision++;dirty=true;if(!$('#equationConfirmed').checked){clearPlots();invalidate();}};
$('#usePlots').onclick=()=>{if(!state.plots)return;evidenceTask.cancel();sessionRevision++;const changedUnit=$('#unit').value!=='agb'||$('#group').value!=='general';if(changedUnit)$('#previous').value='';$('#unit').value='agb';$('#group').value='general';$('#current').value=state.plots.agbTonnes;$('#inputSource').value=`${state.plotFile?.name||t('imported')} · Ogawa (1965), TGO v2`;state.plotUsed=true;invalidate();fields();tab('calculate');if(changedUnit)message(getLang()==='th'?'ผลแปลงเป็น AGB กรุณากรอกค่าฐานในหน่วยตัน AGB ใหม่':'Plot estimate is AGB. Enter the baseline again in tonnes AGB.');};
const world=initWorld({t,fmt,getLang});
const about=initAbout({getLang,fmt});
const registry=initRegistry({t,fmt,getLang});
const digest=initDigest({t,fmt,getLang});
digest.ready.then(d=>{
  world.setDigestPanel(()=>digest.panelHTML(d));
  landscape.setDigestBars(()=>digest.marketBarsHTML(d));
  landscape.render();
}).catch(err=>error(err));
registry.ready.then(()=>{if(state.boundary)renderRegistry();}).catch(err=>error(err));
let hashTimer=null;
function cancelHash(){clearTimeout(hashTimer);hashTimer=null;}
window.addEventListener('carbona-regionchange',cancelHash);
function writeHash(s){cancelHash();if(!s)return;if(s.kind==='boundary'||s.kind==='box'){const u=new URL(location.href);u.hash='';history.replaceState(null,'',u);return;}hashTimer=setTimeout(()=>{if(document.body.dataset.region)return;const u=new URL(location.href);u.hash=JSON.stringify({kind:s.kind,code:s.code});history.replaceState(null,'',u);},400);}
async function applyHash(){
 const h=initialHash;if(!h||h.length<3)return;
 try{if(h.length>3*1024*1024)throw Error('invalid:projectSize');const s=JSON.parse(decodeURIComponent(h.slice(1)));
  if(s.kind==='boundary'||s.kind==='box'){
   // Consume private legacy fragments before any locale/navigation code can copy them.
   const u=new URL(location.href);u.hash='';history.replaceState(null,'',u);cancelHash();
   if(s.kind==='boundary'){
    if(confirm(getLang()==='th'?'ลิงก์เก่ามีขอบเขตส่วนตัว ต้องการนำเข้าในเบราว์เซอร์นี้หรือไม่?':'This legacy link contains a private boundary. Import it locally?')){const revision=++sessionRevision;message(getLang()==='th'?'กำลังตรวจขอบเขต…':'Validating boundary…');const boundary=await evidenceTask.run('boundary',s.geojson);if(revision!==sessionRevision)return;clearPlots();state.boundary=boundary;state.boundaryFile={name:'legacy-link.geojson',tier:'user-import'};state.sample=false;invalidate();redrawBoundary();summary();}
   }else if(Array.isArray(s.box)&&s.box.length===4&&s.box.every(Number.isFinite)&&s.box[0]>=97&&s.box[2]<=106&&s.box[1]>=5&&s.box[3]<=21&&s.box[0]<s.box[2]&&s.box[1]<s.box[3]){
    if(confirm(getLang()==='th'?'เปิดพื้นที่จากลิงก์เก่าในเบราว์เซอร์นี้หรือไม่?':'Open the area from this legacy link locally?'))return landscape.select({kind:'box',box:s.box});
   }return;
  }
  if(['national','province'].includes(s.kind)&&typeof s.code==='string'&&/^[A-Z0-9_-]{1,12}$/.test(s.code))return landscape.select({kind:s.kind,code:s.code});
 }catch{const u=new URL(location.href);u.hash='';history.replaceState(null,'',u);message(getLang()==='th'?'ลิงก์พื้นที่ไม่ถูกต้อง กรุณานำเข้าไฟล์ขอบเขต':'Invalid area link. Import a boundary file instead.');}
}
function showAbout(){document.querySelector('.reference-menu').open=false;document.querySelectorAll('.lenses [data-tab]').forEach(e=>e.setAttribute('aria-pressed','false'));document.body.dataset.about='true';$('#about').hidden=false;$('#aboutTab').setAttribute('aria-pressed','true');$('#about').scrollTop=0;setNav();about.show().catch(err=>error(err));}
const landscape=initLandscape({map,t,fmt,getLang,getBoundary:()=>state.boundary,download,message,onSelect:()=>{if(state.tab!=='carbon'||document.body.dataset.about)tab('carbon');},onState:writeHash});
landscape.ready.catch(err=>error(err));
landscape.ready.then(applyHash).catch(()=>{});
initUrban({map,t,fmt,getLang});
initGeocode({map,t,fmt,getLang});
initMeasure({map,t,getLang});
$('#showUrban').onclick=()=>{const on=!urbanShown();urbanToggle(on);$('#showUrban').setAttribute('aria-pressed',String(on));};
// Private fragments are consumed by applyHash once the landscape is ready.
setLang(getLang());$('#standardsLink').href=`research-${getLang()}.html#standards`;fields();summary();
document.querySelectorAll('.flow span').forEach((el,i)=>el.textContent=(getLang()==='th'?['ดาวเทียม + แปลงสำรวจ','แบบจำลองมวลชีวภาพ','ตรวจสอบด้วยแปลงอิสระ','รับรองวิธี + ทวนสอบ']:['Satellite + plots','Biomass model','Independent validation','Method approval + verification'])[i]);
loadJSON('version.json',{validate:v=>typeof v?.commit==='string'}).then(v=>{state.version=v.commit;$('#version').textContent=v.commit;}).catch(()=>{$('#version').textContent=getLang()==='th'?'ไม่ทราบรุ่น':'Version unavailable';});
loadJSON('data/source-catalog.json',{validate:d=>Array.isArray(d)&&d.length<500&&d.every(s=>['name','use','tier'].every(k=>typeof s?.[k]?.th==='string'&&typeof s?.[k]?.en==='string')&&typeof s.date==='string'&&/^https:\/\//.test(s.url))}).then(s=>{state.sources=s;state.sourceStatus='ready';renderSources();}).catch(()=>{state.sourceStatus='unavailable';$('#sourceList').textContent=getLang()==='th'?'โหลดรายการแหล่งข้อมูลไม่ได้ ลองรีเฟรชเมื่อออนไลน์':'Source catalogue unavailable. Refresh when connected.';});
loadJSON('data/province-forest-area.json',{validate:d=>Array.isArray(d)&&d.length<5000&&d.every(r=>typeof r?.province_th==='string'&&Number.isInteger(r.year_ce)&&Number.isInteger(r.year_be)&&Number.isFinite(r.forest_area_rai)&&r.forest_area_rai>=0)}).then(p=>{state.province=p;state.provinceStatus='ready';renderSources();}).catch(()=>{state.provinceStatus='unavailable';$('#provincePreview').textContent=getLang()==='th'?'ข้อมูลอ้างอิงจังหวัดไม่พร้อมใช้':'Province reference unavailable';});
// Desktop: the world feeds are context, not the selection's readout. They open as the left column on
// request, so the map keeps the first screen (MSH B9: map >= 60% of 1440x900).
$('#worldToggle').onclick=()=>{const open=!('worldOpen' in document.body.dataset);if(open)document.body.dataset.worldOpen='';else delete document.body.dataset.worldOpen;$('#worldToggle').setAttribute('aria-expanded',String(open));map.invalidateSize();};
$('#worldMobile').onclick=()=>{document.querySelector('.more-nav').open=false;delete document.body.dataset.about;$('#about').hidden=true;$('#aboutTab').setAttribute('aria-pressed','false');document.body.dataset.view='world';setNav();};
window.addEventListener('resize',()=>map.invalidateSize());

// Close the reading menu after opening a separate document.
document.querySelector('.reference-menu').addEventListener('click',e=>{if(e.target.closest('a'))document.querySelector('.reference-menu').open=false;});
// Reserve the actual navigation height when text enlargement wraps its rows.
new ResizeObserver(([entry])=>document.body.style.setProperty('--nav-space',`${entry.target.getBoundingClientRect().height+8}px`)).observe(document.querySelector('.bottom-nav'));

// The phone header is ONE band. The map's tools were a second row of three buttons under
// the bar, which pushed the map a third of the way down the screen for furniture the reader
// opens once. On the phone they drop from the bar as a panel instead.
const mapChromeToggle=document.querySelector('#mapChromeToggle');
const setMapChrome=open=>{
 if(!mapChromeToggle)return;
 mapChromeToggle.setAttribute('aria-expanded',String(open));
 document.querySelector('header.top').classList.toggle('map-chrome-open',open);
};
if(mapChromeToggle){
 mapChromeToggle.addEventListener('click',()=>setMapChrome(mapChromeToggle.getAttribute('aria-expanded')!=='true'));
 // Escape closes it and returns the focus to the control that opened it.
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mapChromeToggle.getAttribute('aria-expanded')==='true'){setMapChrome(false);mapChromeToggle.focus({preventScroll:true});}});
}

document.addEventListener('click',e=>{
 for(const menu of document.querySelectorAll('.map-tools,.reference-menu,.more-nav'))if(!menu.contains(e.target))menu.open=false;
 if(mapChromeToggle&&!e.target.closest('#mapChromePanel,#mapChromeToggle'))setMapChrome(false);
});

document.querySelector('.map-tools').addEventListener('click',e=>{const button=e.target.closest('button');if(button){document.querySelector('.map-tools').open=false;(button.id==='openForestWatch'?$('#tabBody'):button.id==='moreLayers'?$('#base'):$('#map')).focus({preventScroll:true});}});
document.querySelector('.more-nav').addEventListener('click',e=>{if(e.target.closest('button'))(document.body.dataset.view==='world'?$('#worldRail'):$('#tabBody')).focus({preventScroll:true});});

// Explicit local-file recovery; no server upload or permanent browser cache.
$('#projectName').addEventListener('input',()=>{evidenceTask.cancel();message('');sessionRevision++;dirty=true;});
$('#saveProject').onclick=()=>{
 const form=Object.fromEntries(FORM_FIELDS.map(k=>[k,$('#'+k).value]));
 const draft=createDraft({...state,projectName:$('#projectName').value,form,equationConfirmed:$('#equationConfirmed').checked,appVersion:state.version});
 const text=JSON.stringify(draft);if(new TextEncoder().encode(text).length>MAX_SESSION){error(Error('invalid:projectSize'));return;}
 download('carbona-project.json',text,'application/json');dirty=false;
};
$('#openProjectButton').onclick=()=>$('#openProject').click();
$('#openProject').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;const revision=++sessionRevision;
 try{
  if(file.size>MAX_SESSION)throw Error('invalid:projectSize');
  const text=await file.text();if(revision!==sessionRevision)return;message(getLang()==='th'?'กำลังตรวจไฟล์โครงการ…':'Validating project file…');const project=await evidenceTask.run('project',text);if(revision!==sessionRevision)return;
  if(dirty&&!confirm(getLang()==='th'?'แทนที่งานที่ยังไม่ได้บันทึกด้วยไฟล์นี้หรือไม่?':'Replace unsaved work with this project file?'))return;
  cancelHash();clearPlots();Object.assign(state,...['boundary','boundaryFile','rows','plots','plotFile','plotUsed','sample','input','result'].map(k=>({[k]:project[k]})));
  $('#projectName').value=project.projectName;for(const k of FORM_FIELDS)$('#'+k).value=project.form[k];$('#equationConfirmed').checked=project.equationConfirmed;
  $('#usePlots').disabled=!state.plots;fields();redrawBoundary();summary();renderPlots();renderResult();dirty=false;
  message(getLang()==='th'?'เปิดไฟล์ในเบราว์เซอร์แล้ว ตรวจหลักฐานและคำนวณเมื่อพร้อม':'Project opened locally. Review the evidence and calculate when ready.');
 }catch(err){if(revision===sessionRevision)error(err);}finally{e.target.value='';}
};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
