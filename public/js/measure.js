// Distance + area measurement on the map (orientation only).
// Click to add vertices; click Done to finish; Clear to reset.
import {fmt,t} from './i18n.js';

const RAD=Math.PI/180,R=6371008.8;
let map,tFn,getLang,active=false,pts=[],line=null,poly=null,ctrl=null,popup=null;
let btn=null;

export function initMeasure({map:m,t:t_,getLang:g_}){
  map=m;tFn=t_;getLang=g_;
  buildUI();
}
function buildUI(){
  ctrl=L.control({position:'bottomright'});
  ctrl.onAdd=()=>{
    const div=L.DomUtil.create('div','measure-ctrl');
    div.innerHTML=`
      <button type="button" id="measureBtn" class="btn ghost" aria-pressed="false" title="${tFn('measure')}">${tFn('measure')}</button>
      <div id="measurePanel" class="measure-panel" hidden>
        <button type="button" id="measureDone" class="btn small ghost" title="${tFn('measureFinish')}">${tFn('measureFinish')}</button>
        <button type="button" id="measureClear" class="btn small ghost" title="${tFn('measureClear')}">${tFn('measureClear')}</button>
        <div id="measureReadout" class="measure-readout">—</div>
      </div>`;
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);
    return div;
  };
  ctrl.addTo(map);
  btn=document.getElementById('measureBtn');
  const done=document.getElementById('measureDone');const clear=document.getElementById('measureClear');const readout=document.getElementById('measureReadout');
  document.addEventListener('langchange',()=>{
    btn.textContent=tFn('measure');btn.title=tFn('measure');done.textContent=done.title=tFn('measureFinish');clear.textContent=clear.title=tFn('measureClear');
    const distance=pts.reduce((sum,p,i)=>i?sum+haversine(pts[i-1].lat,pts[i-1].lng,p.lat,p.lng):0,0);
    updateReadout(distance,pts.length>=3?sphericalArea(pts):0);
  });
  btn.onclick=()=>toggle();
  done.onclick=()=>{endMeasure();};
  clear.onclick=()=>{reset();};
  map.on('click',onClick);
  map.on('dragend',()=>{if(active)popup?.setLatLng(pts[pts.length-1]||map.getCenter());});
}
function toggle(){
  active=!active;btn.setAttribute('aria-pressed',String(active));
  const panel=document.getElementById('measurePanel');
  if(active){map.getContainer().classList.add('measuring');btn.classList.add('btn-pressed');panel.hidden=false;reset();map.getContainer().style.cursor='crosshair';}
  else{endMeasure();map.getContainer().classList.remove('measuring');btn.classList.remove('btn-pressed');panel.hidden=true;map.getContainer().style.cursor='';}
}
function reset(){pts=[];clearLayers();popup?.close();updateReadout();}
function endMeasure(){active=false;btn.setAttribute('aria-pressed','false');const panel=document.getElementById('measurePanel');panel.hidden=true;map.getContainer().classList.remove('measuring');btn.classList.remove('btn-pressed');map.getContainer().style.cursor='';popup?.close();}
function clearLayers(){if(line){map.removeLayer(line);line=null;}if(poly){map.removeLayer(poly);poly=null;}}
function onClick(e){if(!active)return;pts.push(e.latlng);update();}
function update(){
  popup=popup||L.popup();
  clearLayers();
  let distM=0;
  for(let i=1;i<pts.length;i++)distM+=haversine(pts[i-1].lat,pts[i-1].lng,pts[i].lat,pts[i].lng);
  let areaM2=pts.length>=3?sphericalArea(pts):0;
  if(pts.length>=2){
    const opts={color:'#ffcc00',weight:3,opacity:0.9,dashArray:'6 6',interactive:false};
    line=L.polyline(pts,opts).addTo(map);
  }
  if(pts.length>=3){
    poly=L.polygon(pts,{color:'#ffcc00',weight:2,opacity:0.6,fillColor:'#ffcc00',fillOpacity:0.12,interactive:false}).addTo(map);
  }
  if(pts.length)popup.setLatLng(pts[pts.length-1]);
  updateReadout(distM,areaM2);
  if(pts.length>=2)popup.setContent(formatDist(distM)+(areaM2>0?` · ${formatArea(areaM2)}`:'')).openOn(map);
}
function haversine(la1,lo1,la2,lo2){
  const a1=la1*RAD,a2=la2*RAD,dLa=(la2-la1)*RAD,dLo=(lo2-lo1)*RAD;
  const h=Math.sin(dLa/2)**2+Math.cos(a1)*Math.cos(a2)*Math.sin(dLo/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));
}
function sphericalArea(ring){
  // Equirectangular projection about centroid, accurate for city/district scale.
  // Accepts Leaflet LatLng objects ({lat,lng}) or plain [lat,lng] pairs.
  const lat=p=>p?.lat??p?.[0],lng=p=>p?.lng??p?.[1];
  const clat=ring.reduce((s,p)=>s+lat(p),0)/ring.length;
  const clon=ring.reduce((s,p)=>s+lng(p),0)/ring.length;
  const cr=clat*RAD;
  const pts=ring.map(p=>[(lng(p)-clon)*RAD*R*Math.cos(cr),(lat(p)-clat)*RAD*R]);
  let area=0;
  for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length;area+=pts[i][0]*pts[j][1]-pts[j][0]*pts[i][1];}
  return Math.abs(area)/2;
}
function updateReadout(distM,areaM2){
  const readout=document.getElementById('measureReadout');
  if(!readout)return;
  let parts=[];
  if(distM>0)parts.push(formatDist(distM));
  if(areaM2>0)parts.push(formatArea(areaM2));
  readout.textContent=parts.length?parts.join(' · '):'—';
}
function formatDist(m){
  if(m>=1000)return `${fmt(m/1000,2)} ${t('measureKm')}`;
  return `${fmt(m,0)} m`;
}
function formatArea(m2){
  if(m2>=1600)return `${fmt(m2/1600,2)} ${t('measureHa')}`; // 1 rai = 1600 m²
  return `${fmt(m2,0)} ${t('measureSqm')}`;
}

export {haversine,sphericalArea,formatDist,formatArea};
