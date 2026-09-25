// Carbon map lens: province / drawn box / project boundary → landscape ledger. Rendering only; arithmetic lives in ledger.js.
import {readGrid,sumSelection,ledgerRows,polygonsOf,boxSideKm} from './ledger.js';

const GIBS='https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/';
const ATMOS={
  aod:{layer:'VIIRS_NOAA20_AOD_Deep_Blue_Land_Ocean',matrix:'GoogleMapsCompatible_Level6',max:6,lag:2,note:'aerosolNote'},
  co:{layer:'AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Monthly_Day',matrix:'GoogleMapsCompatible_Level6',max:6,lag:70,monthly:true,note:'coNote'},
  xco2:{layer:'OCO-2_Carbon_Dioxide_Total_Column_Average',matrix:'GoogleMapsCompatible_Level8',max:8,lag:70,note:'xco2Note'},
  fire:{wms:'VIIRS_NOAA20_Thermal_Anomalies_375m_All',lag:2,note:'fireDetNote'},
};
const FLUX_CLASSES=[[-Infinity,'#1f5f4a'],[-1,'#5e9480'],[-.25,'#d9d6cc'],[.25,'#d39a6a'],[1,'#9c4a1a']]; // diverging, neutral midpoint
const GROUP_ORDER=['forest','savanna_shrub_grass','cropland','deforestation','peat','other'];

export function initLandscape({map,t,fmt,getLang,getBoundary,download,message}){
  const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const S={data:null,manifest:null,grid:null,gridPromise:null,sel:null,src:null,rows:[],layer:null,shape:null,overlay:null,atmos:null,drawing:false};
  const byCode=new Map();

  const ready=Promise.all(['manifest.json','provinces.json','provinces.geojson'].map(f=>fetch('data/ledger/'+f).then(r=>{if(!r.ok)throw Error('ledger:'+f);return r.json();})))
    .then(([manifest,data,geo])=>{
      S.manifest=manifest;S.data=data;
      data.provinces.forEach(p=>byCode.set(p.pcode,p));byCode.set('TH',data.national);
      S.layer=L.geoJSON(geo,{style:()=>({color:'#f6f4ec',weight:.6,opacity:.45,fillOpacity:0}),
        onEachFeature:(f,l)=>l.on('click',()=>{if(!S.drawing)select({kind:'province',code:f.properties.pcode});})}).addTo(map);
      fillPlaces();select({kind:'national',code:'TH'},false);
    });

  function fillPlaces(){
    const name=p=>getLang()==='th'?p.name_th:p.name_en,cur=$('#place').value;
    const opts=[...S.data.provinces].sort((a,b)=>name(a).localeCompare(name(b),getLang()));
    $('#place').innerHTML=`<option value="TH">${esc(t('thailand'))}</option>`+opts.map(p=>`<option value="${p.pcode}">${esc(name(p))}</option>`).join('')+'<option value="box" hidden></option>';
    $('#place').value=S.sel?.kind==='box'||S.sel?.kind==='boundary'?'box':cur||'TH';
  }
  const placeName=p=>p.pcode==='TH'?t('verdictNational'):getLang()==='th'?p.name_th:p.name_en;

  async function loadGrid(){
    if(S.grid)return S.grid;
    S.gridPromise??=fetch('data/ledger/grid.bin').then(r=>{if(!r.ok)throw Error('ledger:grid');return r.arrayBuffer();}).then(b=>S.grid=readGrid(b,S.manifest.grid));
    return S.gridPromise;
  }

  async function select(sel,fit=true){
    S.sel=sel;if(S.shape){map.removeLayer(S.shape);S.shape=null;}
    styleProvinces();
    if(sel.kind==='province'||sel.kind==='national'){
      S.src=byCode.get(sel.code);$('#place').value=sel.code;
      if(fit){if(sel.kind==='national')map.setView([13.3,101],5.7);else S.layer.eachLayer(l=>{if(l.feature.properties.pcode===sel.code)map.fitBounds(l.getBounds(),{padding:[30,30]});});}
    }else{
      $('#place').value='box';$('#kStock').textContent=t('loading');
      const grid=await loadGrid(),{totals,cells}=sumSelection(grid,sel.box?{box:sel.box}:{polygons:sel.polygons});
      S.src={...totals,cells,pcode:null};
      S.shape=(sel.box?L.rectangle([[sel.box.south,sel.box.west],[sel.box.north,sel.box.east]]):L.geoJSON(sel.geojson)).setStyle({color:'#ffcc00',weight:3,fillOpacity:.08,interactive:false}).addTo(map);
    }
    render();
  }

  function rowsFor(){
    const s=S.src,side=S.sel.kind==='box'?boxSideKm(S.sel.box):S.sel.kind==='boundary'?Math.sqrt(getBoundary()?.hectares||0)/10:null;
    return ledgerRows(s,S.manifest.datasets,{minSideKm:side});
  }
  const num=(v,d=0)=>v==null?'—':fmt(v,d);
  const big=v=>v==null?'—':Math.abs(v)>=1e6?`${fmt(v/1e6,2)} M`:fmt(v,0);

  function render(){
    if(!S.src)return;
    const s=S.src;S.rows=rowsFor();const r=id=>S.rows.find(x=>x.id===id);
    const stock=r('stock_forest'),rem=r('forest_removals'),em=r('forest_emissions');
    $('#kArea').textContent=`${big(s.area_ha)} ${t('ha')}`;
    $('#kAreaHint').textContent=s.cells!=null?t('boxHint').replace('{c}',fmt(s.cells)):t('forestShare').replace('{f}',fmt(100*s.forest_area_ha/s.area_ha,1));
    $('#kStock').textContent=stock?.tooCoarse?'—':big(stock?.value);
    const pct=b=>fmt(100*(b[1]-stock.value)/stock.value,b[1]-stock.value<.01*stock.value?2:0);
    $('#kStockHint').textContent=stock?.tooCoarse?t('tooCoarseGrid'):stock?`${t('band')}: ±${pct(stock.optimistic)}% – ±${pct(stock.conservative)}% · CCI v7.0`:'—';
    $('#kRemove').textContent=big(rem?.value);$('#kEmit').textContent=big(em?.value);
    $('#kRemoveHint').textContent=$('#kEmitHint').textContent=rem?'GFW v1.4.3 · 2001–2025':t('gridNotIngested').split('.')[0];
    $('#carbonVerdict').textContent=rem?t('verdictLine').replace('{n}',placeName(s)).replace('{r}',big(rem.value)).replace('{e}',big(em.value)):t('verdictBox').replace('{s}',big(stock?.value));
    $('#ledger').innerHTML=ledgerHTML(s);
  }

  function line(label,value,unit,meta,note,cls=''){
    return `<div class="lrow ${cls}"><div class="lhead"><span>${esc(label)}</span><b>${value}</b><small>${esc(unit)}</small></div>${meta?`<p class="lmeta">${esc(meta)}</p>`:''}${note?`<p class="hint">${esc(note)}</p>`:''}</div>`;
  }
  const dsMeta=d=>[d.name,d.version,d.year||d.period,d.resolution].filter(Boolean).join(' · ');

  function ledgerHTML(s){
    const r=id=>S.rows.find(x=>x.id===id),ds=S.manifest.datasets,h=[];
    const sf=r('stock_forest'),sa=r('stock_all');
    h.push(`<h3 class="lside">${esc(t('absorbSide'))}</h3>`);
    if(sf&&sf.tooCoarse)h.push(line(t('rStockForest'),'—','tCO₂e',dsMeta(ds.cci),t('tooCoarseGrid'),'unavailable'));
    else if(sf)h.push(line(t('rStockForest'),big(sf.value),'tCO₂e',dsMeta(ds.cci)+' · '+dsMeta(ds.fnf),'',`verdict-row`)+
      `<p class="band">${esc(t('band'))}: ${big(sf.optimistic[0])}–${big(sf.optimistic[1])} <small>${esc(t('bandOpt'))}</small><br>${big(sf.conservative[0])}–${big(sf.conservative[1])} <small>${esc(t('bandCons'))}</small></p><p class="hint">${esc(t('bandNote'))}</p>`);
    if(sa&&!sa.tooCoarse)h.push(line(t('rStockAll'),big(sa.value),'tCO₂e',dsMeta(ds.cci)));
    const rem=r('forest_removals'),em=r('forest_emissions'),net=r('forest_net'),fl=r('forest_flux');
    if(rem)h.push(line(t('rRemovals'),big(rem.value),'tCO₂e/yr',dsMeta(ds.gfw),t('gfwNote')));
    if(fl)h.push(line(t('rFlux'),'—','tCO₂e/yr',dsMeta(ds.gfw),t('gridNotIngested'),'unavailable'));
    h.push(`<h3 class="lside">${esc(t('emitSide'))}</h3>`);
    if(em)h.push(line(t('rEmissions'),big(em.value),'tCO₂e/yr',dsMeta(ds.gfw)));
    if(net)h.push(line(t('rNet'),big(net.value),'tCO₂e/yr','GFW',net.value<0?(getLang()==='th'?'ค่าติดลบ = ป่าเป็นแหล่งดูดซับสุทธิ':'Negative = net forest sink'):''));
    const fire=r('fire');
    if(fire)h.push(line(t('rFire'),fire.tooCoarse?'—':big(fire.value),'tCO₂/yr',dsMeta(ds.gfed),fire.tooCoarse?t('tooCoarse'):t('fireNote'),fire.tooCoarse?'unavailable':'')+(fire.tooCoarse?'':fireCharts(s)));
    const fos=r('fossil');
    if(fos)h.push(line(t('rFossil'),fos.tooCoarse?'—':big(fos.value),'tCO₂/yr',dsMeta(ds.odiac),fos.tooCoarse?t('tooCoarse'):t('fossilNote'),fos.tooCoarse?'unavailable':''));
    if(s.climatetrace_2024||s.btr1_2022)h.push(`<h3 class="lside">${esc(t('crossSide'))}</h3>`);
    const ct=s.climatetrace_2024;
    if(ct)h.push(`<div class="lrow"><p class="lmeta">${esc(t('ctTitle'))}</p><dl class="cross"><dt>${esc(t('ctFires'))}</dt><dd>${big(ct['forest-land-fires'])}</dd><dt>${esc(t('ctClearing'))}</dt><dd>${big(ct['forest-land-clearing'])}</dd><dt>${esc(t('ctNet'))}</dt><dd>${big(ct['net-forest-land'])}</dd></dl></div>`);
    const b=s.btr1_2022;
    if(b)h.push(`<div class="lrow"><p class="lmeta">${esc(t('btrTitle'))}</p><dl class="cross"><dt>${esc(t('btrForest'))}</dt><dd>${big(b.forest_remaining_emissions*1e3)} / ${big(b.forest_remaining_removals*1e3)} / ${big(b.forest_remaining_net*1e3)}</dd><dt>${esc(t('btrConv'))}</dt><dd>${big(b.land_to_cropland*1e3)}</dd><dt>${esc(t('btrCrop'))}</dt><dd>${big(b.cropland_remaining_net*1e3)}</dd><dt>${esc(t('btrTotal'))}</dt><dd>${big(b.lulucf_net*1e3)}</dd></dl><p class="hint">${esc(t('btrNote'))}</p></div>`);
    return h.join('');
  }

  function fireCharts(s){
    if(!s.fire_c_t_monthly)return '';
    const m=s.fire_c_t_monthly,max=Math.max(...m,1e-9),months=getLang()==='th'?['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']:['J','F','M','A','M','J','J','A','S','O','N','D'];
    const bars=m.map((v,i)=>`<div class="bar${i>=1&&i<=3?' season':''}" title="${esc(months[i])}: ${fmt(v,0)} t C"><i style="height:${(100*v/max).toFixed(1)}%"></i><span>${esc(months[i])}</span></div>`).join('');
    const g=s.fire_c_t_groups,total=Object.values(g).reduce((a,b)=>a+b,0)||1;
    const groups=GROUP_ORDER.filter(k=>g[k]>0).map(k=>`<div class="share"><span>${esc(t('g_'+k))}</span><i style="width:${(100*g[k]/total).toFixed(1)}%"></i><b>${fmt(100*g[k]/total,1)}%</b></div>`).join('');
    const table=m.map((v,i)=>`<tr><td>${esc(months[i])}</td><td>${fmt(v,0)}</td></tr>`).join('');
    return `<figure class="fire-chart"><figcaption>${esc(t('fireMonthly'))} · <span class="season-key">${esc(t('season'))}</span></figcaption><div class="bars" role="img" aria-label="${esc(t('fireMonthly'))}">${bars}</div><details><summary>${getLang()==='th'?'ตารางข้อมูล':'Data table'}</summary><table>${table}</table></details></figure><figure class="fire-share"><figcaption>${esc(t('fireByGroup'))}</figcaption>${groups}<p class="hint">${esc(t('defNote'))}</p></figure>`;
  }

  // ---- drawing a box: pointer events, touch-friendly; map panning paused while drawing ----
  const box={start:null,rect:null};
  function setDrawing(on){
    S.drawing=on;$('#drawBox').setAttribute('aria-pressed',String(on));$('#drawBox').textContent=t(on?'drawing':'drawBox');$('#drawHint').hidden=!on;
    map.getContainer().classList.toggle('drawing',on);on?map.dragging.disable():map.dragging.enable();
    if(on)document.body.dataset.view='map';
  }
  if(innerWidth>700)$('#layerMore').open=true;
  const el=map.getContainer();
  el.addEventListener('pointerdown',e=>{if(!S.drawing||e.target.closest('.layer-panel,.leaflet-control'))return;e.preventDefault();el.setPointerCapture(e.pointerId);box.start=map.mouseEventToLatLng(e);box.rect?.remove();box.rect=L.rectangle([box.start,box.start],{color:'#ffcc00',weight:2,dashArray:'4 4',fillOpacity:.05,interactive:false}).addTo(map);});
  el.addEventListener('pointermove',e=>{if(S.drawing&&box.start)box.rect.setBounds([box.start,map.mouseEventToLatLng(e)]);});
  el.addEventListener('pointerup',e=>{
    if(!S.drawing||!box.start)return;const end=map.mouseEventToLatLng(e),a=box.start;box.start=null;box.rect.remove();box.rect=null;setDrawing(false);
    const b={west:Math.min(a.lng,end.lng),east:Math.max(a.lng,end.lng),south:Math.min(a.lat,end.lat),north:Math.max(a.lat,end.lat)};
    if(b.east-b.west<1e-4||b.north-b.south<1e-4)return;
    select({kind:'box',box:b}).catch(err=>message(String(err.message||err)));
  });
  $('#drawBox').onclick=()=>setDrawing(!S.drawing);
  $('#nationalView').onclick=()=>select({kind:'national',code:'TH'});
  $('#useBoundary').onclick=()=>{const b=getBoundary();if(!b){message(t('noBoundaryYet'));return;}const polygons=polygonsOf(b.geojson);select({kind:'boundary',polygons,geojson:b.geojson,box:null}).then(()=>map.fitBounds(S.shape.getBounds(),{padding:[30,30]})).catch(err=>message(String(err.message||err)));};
  $('#place').addEventListener('change',()=>{const v=$('#place').value;if(v==='TH')select({kind:'national',code:'TH'});else if(byCode.has(v))select({kind:'province',code:v});});

  // ---- overlays ----
  function legend(html){$('#overlayLegend').innerHTML=html;$('#overlayLegend').hidden=!html;}
  // One place decides province styling: selection outline plus, when chosen, the flux choropleth.
  function styleProvinces(){
    if(!S.layer)return;
    const flux=S.overlayKind==='flux',years=S.manifest.datasets.gfw.years;
    S.layer.setStyle(f=>{
      const sel=f.properties.pcode===S.sel?.code,p=byCode.get(f.properties.pcode),v=p.gfw_net_mg_co2e/p.area_ha/years;
      return {color:sel?'#ffcc00':flux?'#1b2140':'#f6f4ec',weight:sel?3:.6,opacity:sel?1:flux?.6:.45,
        fillOpacity:flux?.75:0,fillColor:flux?[...FLUX_CLASSES].reverse().find(([lo])=>v>=lo)[1]:undefined};
    });
  }
  function setOverlay(kind){
    S.overlayKind=kind;
    if(S.overlay){map.removeLayer(S.overlay);S.overlay=null;}
    styleProvinces();
    const b=S.manifest.overlayBounds;
    if(kind==='stock'){S.overlay=L.imageOverlay('data/ledger/overlay-stock.png',b,{opacity:.85,interactive:false}).addTo(map);legend(swatches([['#e5efd8','1'],['#bcd9a3','50'],['#8fbf6f','100'],['#5f9e48','200'],['#356f2e','350'],['#17441c','500+']],t('legendStock')));}
    else if(kind==='fnf'){S.overlay=L.imageOverlay('data/ledger/overlay-fnf.png',b,{opacity:.8,interactive:false}).addTo(map);legend(swatches([['#00b200','≥90%'],['#83ef62','10–90%']],t('legendFnf')));}
    else if(kind==='flux'){
      legend(swatches([['#1f5f4a','< −1'],['#5e9480','−1…−0.25'],['#d9d6cc','±0.25'],['#d39a6a','0.25…1'],['#9c4a1a','> 1']],t('legendFlux')));
    }else legend('');
  }
  const swatches=(items,title)=>`<b>${esc(title)}</b>`+items.map(([c,l])=>`<span><i style="background:${c}"></i>${esc(l)}</span>`).join('');
  document.querySelectorAll('input[name=overlay]').forEach(i=>i.addEventListener('change',()=>ready.then(()=>setOverlay(i.value))));

  const iso=d=>d.toISOString().slice(0,10);
  function setAtmos(){
    if(S.atmos){map.removeLayer(S.atmos);S.atmos=null;}
    const k=$('#atmos').value,cfg=ATMOS[k];$('#atmosNote').hidden=!cfg;$('#atmosDate').hidden=!cfg;if(!cfg)return;
    $('#atmosNote').textContent=t(cfg.note);
    let date=$('#atmosDate').value||iso(new Date(Date.now()-cfg.lag*864e5));if(cfg.monthly)date=date.slice(0,8)+'01';$('#atmosDate').value=date;
    const attribution='NASA EOSDIS GIBS';
    S.atmos=cfg.wms?L.tileLayer.wms('https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi',{layers:cfg.wms,format:'image/png',transparent:true,version:'1.3.0',time:date,attribution,opacity:.9})
      :L.tileLayer(`${GIBS}${cfg.layer}/default/${date}/${cfg.matrix}/{z}/{y}/{x}.png`,{maxNativeZoom:cfg.max,maxZoom:18,opacity:.7,attribution});
    S.atmos.addTo(map);
  }
  $('#atmos').addEventListener('change',setAtmos);$('#atmosDate').addEventListener('change',setAtmos);$('#atmosDate').hidden=true;
  $('#atmosDate').max=iso(new Date());

  // ---- export ----
  function payload(){
    return {schemaVersion:1,exportedAt:new Date().toISOString(),language:getLang(),kind:'landscape-screening-estimate',notCredits:true,
      selection:S.sel.kind==='box'?{kind:'box',bbox:S.sel.box}:S.sel.kind==='boundary'?{kind:'project-boundary'}:{kind:S.sel.kind,pcode:S.src.pcode,name_en:S.src.name_en,name_th:S.src.name_th},
      rows:S.rows,crossChecks:{climatetrace_2024:S.src.climatetrace_2024||null,btr1_2022:S.src.btr1_2022||null},
      conversion:S.manifest.conversion,conservation:S.manifest.conservation,datasets:S.manifest.datasets};
  }
  $('#ledgerJSON').onclick=()=>S.src&&download('carbon-ledger.json',JSON.stringify(payload(),null,2),'application/json');
  $('#ledgerCSV').onclick=()=>{if(!S.src)return;const head=['row','value','unit','dataset','version','period','low95_correlated','high95_correlated','low95_independent','high95_independent','note'];
    const body=S.rows.map(r=>[r.id,r.value??'',r.unit,r.dataset.name,r.dataset.version||'',r.dataset.year||r.dataset.period||'',r.conservative?.[0]??'',r.conservative?.[1]??'',r.optimistic?.[0]??'',r.optimistic?.[1]??'',r.unavailable||(r.tooCoarse?'below-dataset-resolution':'')]);
    download('carbon-ledger.csv','﻿'+[head,...body].map(x=>x.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n'),'text/csv;charset=utf-8');};

  return {ready,render:()=>{if(S.data){fillPlaces();render();if(S.overlayKind)setOverlay(S.overlayKind);}if(S.atmos)$('#atmosNote').textContent=t(ATMOS[$('#atmos').value].note);},invalidate:()=>{}};
}
