// Place search via Photon (open, no API key). Falls back silently when offline.
const PHOTON='https://photon.komoot.io/api/';
let map,t,fmt,getLang,geocodeLayer,searchInput,resultsBox,marker;

export function initGeocode({map:m,t:t_,fmt:fmt_,getLang:getLang_}){
  map=m;t=t_;fmt=fmt_;getLang=getLang_;
  geocodeLayer=L.layerGroup().addTo(map);
  marker=null;
  buildUI();wire();
}
function buildUI(){
  const wrap=document.createElement('div');wrap.className='geocode-wrap';
  wrap.innerHTML=`
    <label class="sr" for="geocodeSearch">${t('searchPlace')}</label>
    <input type="search" id="geocodeSearch" placeholder="${t('searchHint')}" autocomplete="off" aria-label="${t('searchPlace')}" role="combobox" aria-expanded="false">
    <div id="geocodeResults" role="listbox" aria-hidden="true"></div>
  `;
  const searchEl=document.querySelector('.search');
  if(searchEl)searchEl.appendChild(wrap);
  searchInput=document.getElementById('geocodeSearch');
  resultsBox=document.getElementById('geocodeResults');
}
let timer=null;
function wire(){
  searchInput.addEventListener('input',e=>{
    clearTimeout(timer);const q=e.target.value.trim();
    resultsBox.hidden=true;resultsBox.setAttribute('aria-expanded','false');resultsBox.replaceChildren();
    if(!q)return;
    timer=setTimeout(()=>fetchResults(q),250);
  });
  searchInput.addEventListener('blur',()=>setTimeout(()=>{resultsBox.hidden=true;resultsBox.setAttribute('aria-expanded','false');},150));
}
async function fetchResults(q){
  try{
    const url=new URL(PHOTON);
    url.searchParams.set('q',q);url.searchParams.set('limit','6');url.searchParams.set('lang',getLang()==='th'?'th':'en');
    const r=await fetch(url,{signal:AbortSignal.timeout(8000)});
    if(!r.ok)return;
    const d=await r.json();renderResults(d.features||[]);
  }catch(e){/* offline or blocked: keep search silent */}
}
function renderResults(features){
  resultsBox.replaceChildren();resultsBox.hidden=false;resultsBox.setAttribute('aria-expanded','true');
  for(const f of features){
    const p=f.properties||{};const name=p.name||p.street||p.city||'';
    const country=p.country||'';const label=country?`${name} · ${country}`:name;
    const item=document.createElement('button');item.type='button';item.className='geocode-item';item.textContent=label;
    item.onclick=()=>{flyTo(p.coordinates[1],p.coordinates[0],name);searchInput.value=name;resultsBox.hidden=true;resultsBox.setAttribute('aria-expanded','false');};
    resultsBox.appendChild(item);
  }
}
function flyTo(lat,lng,name){
  map.setView([lat,lng],11,{animate:true,duration:1});
  if(geocodeLayer){geocodeLayer.clearLayers();if(marker)marker.remove();
    marker=L.marker([lat,lng]).bindPopup(`<b>${esc(name)}</b>`).addTo(geocodeLayer).openPopup();}
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function geocodeClear(){if(geocodeLayer)geocodeLayer.clearLayers();marker=null;if(searchInput)searchInput.value='';if(resultsBox){resultsBox.hidden=true;resultsBox.setAttribute('aria-expanded','false');}}

export {esc};
