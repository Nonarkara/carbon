// Place search via Photon (open, no API key). Only explicitly entered place text is sent.
const PHOTON='https://photon.komoot.io/api/';
let map,t,fmt,getLang,geocodeLayer,searchInput,resultsBox,marker;

export function initGeocode({map:m,t:t_,fmt:fmt_,getLang:getLang_}){
  map=m;t=t_;fmt=fmt_;getLang=getLang_;
  geocodeLayer=L.layerGroup().addTo(map);
  marker=null;
  buildUI();wire();
}
function buildUI(){
  const wrap=document.createElement('details');wrap.className='geocode-wrap';
  wrap.innerHTML=`
    <summary aria-label="${t('searchPlace')}" title="${t('searchPlace')}"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15 15 6 6" stroke="currentColor" stroke-width="2"/></svg></summary><div class="geocode-panel">
    <label class="sr" for="geocodeSearch">${t('searchPlace')}</label>
    <input type="search" id="geocodeSearch" placeholder="${t('searchHint')}" autocomplete="off" aria-label="${t('searchPlace')}" role="combobox" aria-controls="geocodeResults" aria-autocomplete="list" aria-expanded="false">
    <p class="geocode-privacy">${getLang()==='th'?'คำค้นส่งไป Photon / OpenStreetMap · ไม่ส่งไฟล์โครงการ':'Search text goes to Photon / OpenStreetMap; project files stay local.'}</p><p id="geocodeStatus" role="status"></p><div id="geocodeResults" role="listbox" hidden></div></div>
  `;
  const searchEl=document.querySelector('.search');
  if(searchEl)searchEl.appendChild(wrap);
  searchInput=document.getElementById('geocodeSearch');
  resultsBox=document.getElementById('geocodeResults');
  document.addEventListener('langchange',()=>{
    wrap.querySelector('summary').setAttribute('aria-label',t('searchPlace'));wrap.querySelector('summary').title=t('searchPlace');
    wrap.querySelector('label').textContent=t('searchPlace');searchInput.placeholder=t('searchHint');searchInput.setAttribute('aria-label',t('searchPlace'));
    wrap.querySelector('.geocode-privacy').textContent=getLang()==='th'?'คำค้นส่งไป Photon / OpenStreetMap · ไม่ส่งไฟล์โครงการ':'Search text goes to Photon / OpenStreetMap; project files stay local.';
  });
}
let timer=null,requestId=0;
function wire(){
  searchInput.closest('details').addEventListener('toggle',e=>{if(e.target.open)searchInput.focus();});
  const wrap=searchInput.closest('details');
  wrap.addEventListener('keydown',e=>{
    if(e.key==='Escape'){wrap.open=false;wrap.querySelector('summary').focus();}
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      const options=[...resultsBox.querySelectorAll('button')];if(!options.length||resultsBox.hidden)return;
      e.preventDefault();const index=options.indexOf(document.activeElement),step=e.key==='ArrowDown'?1:-1;
      options[(index+step+options.length)%options.length].focus();
    }
  });
  wrap.addEventListener('focusout',e=>{if(!wrap.contains(e.relatedTarget)){resultsBox.hidden=true;searchInput.setAttribute('aria-expanded','false');}});
  document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target))wrap.open=false;});
  searchInput.addEventListener('input',e=>{
    clearTimeout(timer);requestId++;const q=e.target.value.trim();
    resultsBox.hidden=true;searchInput.setAttribute('aria-expanded','false');resultsBox.replaceChildren();
    document.getElementById('geocodeStatus').textContent=q?(getLang()==='th'?'กำลังค้นหา…':'Searching…'):'';
    if(!q)return;
    const id=requestId;timer=setTimeout(()=>fetchResults(q,id),250);
  });

}
async function fetchResults(q,id){
  try{
    const url=new URL(PHOTON);
    url.searchParams.set('q',q);url.searchParams.set('limit','6');url.searchParams.set('lang',getLang()==='th'?'default':'en');
    const r=await fetch(url,{signal:AbortSignal.timeout(8000)});
    if(!r.ok)throw Error('search unavailable');
    const d=await r.json();if(id===requestId)renderResults(Array.isArray(d.features)?d.features:[]);
  }catch(e){if(id===requestId)document.getElementById('geocodeStatus').textContent=getLang()==='th'?'ค้นหาไม่ได้ในขณะนี้ ลองใหม่อีกครั้ง':'Search unavailable. Please try again.';}
}
function renderResults(features){
  resultsBox.replaceChildren();resultsBox.hidden=false;searchInput.setAttribute('aria-expanded','true');
  for(const f of features){
    const coords=f.geometry?.coordinates;if(!Array.isArray(coords)||coords.length<2||!Number.isFinite(coords[0])||!Number.isFinite(coords[1])||Math.abs(coords[0])>180||Math.abs(coords[1])>90)continue;
    const p=f.properties||{};const name=p.name||p.street||p.city||'';
    const country=p.country||'';const label=country?`${name} · ${country}`:name;
    const item=document.createElement('button');item.type='button';item.className='geocode-item';item.textContent=label;item.setAttribute('role','option');
    item.onclick=()=>{flyTo(coords[1],coords[0],name);searchInput.value=name;resultsBox.hidden=true;searchInput.setAttribute('aria-expanded','false');};
    resultsBox.appendChild(item);
  }
  document.getElementById('geocodeStatus').textContent=resultsBox.children.length?'':(getLang()==='th'?'ไม่พบสถานที่':'No places found');
}
function flyTo(lat,lng,name){
  map.setView([lat,lng],11,{animate:true,duration:1});
  if(geocodeLayer){geocodeLayer.clearLayers();if(marker)marker.remove();
    marker=L.marker([lat,lng]).bindPopup(`<b>${esc(name)}</b>`).addTo(geocodeLayer).openPopup();}
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function geocodeClear(){requestId++;clearTimeout(timer);if(geocodeLayer)geocodeLayer.clearLayers();marker=null;if(searchInput)searchInput.value='';if(resultsBox){resultsBox.hidden=true;searchInput.setAttribute('aria-expanded','false');}}

export {esc};
