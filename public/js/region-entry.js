// A geography route in the existing selector, without changing Thai project state.
import {SEA_CODES} from './sea-model.js';
const place=document.querySelector('#place');let names,previous=place.value||'TH';
function add(){if(!names||place.querySelector('[data-sea-route]'))return;const en=document.documentElement.lang==='en',g=document.createElement('optgroup');g.dataset.seaRoute='';g.label=en?'Southeast Asia ↗':'เอเชียตะวันออกเฉียงใต้ ↗';g.append(new Option(en?'All 11 countries ↗':'ทั้ง 11 ประเทศ ↗','sea:SEA'));for(const c of names)g.append(new Option(c.name[en?'en':'th']+' ↗','sea:'+c.iso3));place.options[0].after(g);previous=place.value;}
place.addEventListener('change',e=>{if(!place.value.startsWith('sea:')){previous=place.value;return;}const code=place.value.slice(4);e.stopImmediatePropagation();place.value=previous;const url=new URL('sea.html',location.href);url.searchParams.set('lang',document.documentElement.lang==='en'?'en':'th');if(SEA_CODES.includes(code))url.searchParams.set('country',code);window.open(url.href,'_blank','noopener');},true);
new MutationObserver(add).observe(place,{childList:true});
fetch('data/sea/snapshot.json').then(r=>{if(!r.ok)throw Error('regional navigation unavailable');return r.json();}).then(d=>{names=d.countries;add();}).catch(()=>{/* The original Thai selector remains available. */});
