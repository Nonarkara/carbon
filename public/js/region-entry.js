// The parent document owns private Thai project state; geography only changes the public frame.
import {SEA_CODES,SEA_METRICS} from './sea-model.js';
import {publicURL} from './assessment-session.js';
const place=document.querySelector('#place'),panel=document.querySelector('#regionalView'),frame=document.querySelector('#regionalFrame'),bar=document.querySelector('#workspaceBar');
let names,previous=place.value||'TH',active=null,returnURL=publicURL(location.href).href,embeddedMetric='forest_pct';
const lang=()=>document.documentElement.lang==='en'?'en':'th';
const historyWrite=(url,push=false)=>history[push?'pushState':'replaceState']({carbona:true},'',publicURL(url));
function add(){if(!names||place.querySelector('[data-sea-route]'))return;const en=lang()==='en',g=document.createElement('optgroup');g.dataset.seaRoute='';g.label=en?'Southeast Asia':'เอเชียตะวันออกเฉียงใต้';g.append(new Option(en?'All 11 countries':'ทั้ง 11 ประเทศ','sea:SEA'));for(const c of names)g.append(new Option(c.name[en?'en':'th'],'sea:'+c.iso3));place.options[0].after(g);if(active)place.value='sea:'+active;}
function openRegion(code,{push=false,metric=embeddedMetric,write=true}={}){
 if(code!=='SEA'&&!SEA_CODES.includes(code))return;
 window.dispatchEvent(new Event('carbona-regionchange'));active=code;embeddedMetric=Object.hasOwn(SEA_METRICS,metric)?metric:'forest_pct';document.body.dataset.region=code;panel.hidden=false;
 const url=new URL('sea.html',location.href);url.searchParams.set('lang',lang());url.searchParams.set('embedded','1');url.searchParams.set('metric',embeddedMetric);if(SEA_CODES.includes(code))url.searchParams.set('country',code);
 if(frame.src!==url.href)frame.src=url.href;place.value='sea:'+code;
 const visible=new URL(url);visible.searchParams.delete('embedded');if(write)historyWrite(visible,push);document.title=`${lang()==='th'?'คาร์บอนนะ':'Carbona'} · ${lang()==='th'?'เอเชียตะวันออกเฉียงใต้':'Southeast Asia'}`;
}
function closeRegion({push=false,write=true}={}){window.dispatchEvent(new Event('carbona-regionchange'));active=null;delete document.body.dataset.region;panel.hidden=true;place.value=previous;const original=publicURL(returnURL);original.searchParams.set('lang',lang());if(write)historyWrite(original,push);window.dispatchEvent(new Event('resize'));document.title=`${lang()==='th'?'คาร์บอนนะ':'Carbona'} · forest carbon`;}
place.addEventListener('change',e=>{if(!place.value.startsWith('sea:')){const requested=place.value;if(active)closeRegion({push:true});place.value=requested;previous=requested;return;}e.stopImmediatePropagation();if(!active)returnURL=publicURL(location.href).href;openRegion(place.value.slice(4),{push:!active});},true);
document.querySelector('#aboutTab').addEventListener('click',()=>{if(active)closeRegion({push:true});},true);
new MutationObserver(add).observe(place,{childList:true});
new MutationObserver(()=>{if(active){frame.contentWindow.postMessage({type:'carbona-locale',lang:lang()},location.origin);document.title=lang()==='en'?'Carbona · Southeast Asia':'คาร์บอนนะ · เอเชียตะวันออกเฉียงใต้';}}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
frame.addEventListener('load',()=>{if(active)frame.contentWindow.postMessage({type:'carbona-locale',lang:lang()},location.origin);});
new ResizeObserver(()=>document.body.style.setProperty('--workspace-bar-height',bar.getBoundingClientRect().height+'px')).observe(bar);
window.addEventListener('message',event=>{
 if(!active||event.origin!==location.origin||event.source!==frame.contentWindow)return;
 const d=event.data;if(!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).length>4)return;
 if(d.type==='carbona-country'&&(d.country==='SEA'||SEA_CODES.includes(d.country))&&Object.hasOwn(SEA_METRICS,d.metric)){
  active=d.country;embeddedMetric=d.metric;place.value='sea:'+active;const u=publicURL(location.href);active==='SEA'?u.searchParams.delete('country'):u.searchParams.set('country',active);u.searchParams.set('metric',embeddedMetric);historyWrite(u);
 }
 if(d.type==='carbona-thailand')closeRegion({push:true});
});
window.addEventListener('popstate',()=>{
 const u=publicURL(location.href);
 if(/\/sea(?:\.html)?$/.test(u.pathname))openRegion(u.searchParams.get('country')||'SEA',{metric:u.searchParams.get('metric'),write:false});else closeRegion({write:false});
});
fetch('data/sea/snapshot.json').then(r=>{if(!r.ok)throw Error('regional navigation unavailable');return r.json();}).then(d=>{names=d.countries.filter(c=>SEA_CODES.includes(c.iso3));add();}).catch(()=>{/* The Thai selector remains available. */});
