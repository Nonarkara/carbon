// Urban / built-up detail layer (orientation only).
// City markers sized by approximate population; not a carbon input and never summed.
let map,t,fmt,getLang,cityLayer=null,markerLayer=null,shown=false;

export function initUrban({map:m,t:t_,fmt:fmt_,getLang:getLang_}){
  map=m;t=t_;fmt=fmt_;getLang=getLang_;
  cityLayer=L.layerGroup().addTo(map);
  markerLayer=L.layerGroup().addTo(map);
}
export function urbanToggle(on){
  shown=!!on;
  if(shown){loadAndShow();}
  else{cityLayer.clearLayers();markerLayer.clearLayers();}
}
export function urbanShown(){return shown;}
async function loadAndShow(){
  try{
    const r=await fetch('data/cities.json',{signal:AbortSignal.timeout(10000)});
    if(!r.ok)return;
    const d=await r.json();
    render(d.thailand||[]);
    render(d.seaCapitals||[]);
  }catch(e){/* silent */}
}
function render(list){
  for(const c of list){
    const name=getLang()==='th'?c.name.th:c.name.en;
    const country=c.country?(getLang()==='th'?c.country.th:c.country.en):null;
    const pop=c.population||0;
    const r=markerSize(pop);
    const m=L.circleMarker([c.lat,c.lon],{
      radius:r,color:'#d39a6a',weight:1,opacity:0.9,fillColor:'#f3efe0',fillOpacity:0.75
    }).addTo(markerLayer);
    const label=country?`${name} · ${country}`:name;
    m.bindPopup(`<b>${esc(label)}</b><div class="urban-pop">${t('population')}: ${fmt(pop,0)}</div><div class="urban-note">${esc(t('urbanNote'))}</div>`);
  }
}
function markerSize(pop){
  if(pop>=5000000)return 11;
  if(pop>=1000000)return 9;
  if(pop>=500000)return 7;
  if(pop>=100000)return 5;
  return 4;
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

export {markerSize};
