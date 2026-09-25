export function initWorld({t,fmt,getLang}){
 const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let data=null,busy=false;
 const date=s=>s&&Number.isFinite(Date.parse(s))?new Intl.DateTimeFormat(getLang()==='th'?'th-TH':'en-GB',{dateStyle:'medium',...(s.includes('T')?{timeStyle:'short'}:{})}).format(new Date(s)):'—';
 function spark(f){if(!f.series?.length)return '';const a=f.series.map(p=>p.value),lo=Math.min(...a),hi=Math.max(...a);return `<svg viewBox="0 0 240 38" role="img" aria-label="${esc(f.source)} ${esc(t('sourceDate'))}: ${esc(f.series[0].date)} — ${esc(f.series.at(-1).date)}; ${lo}–${hi} ${esc(f.unit)}"><polyline fill="none" stroke="currentColor" stroke-width="2" points="${a.map((v,i)=>`${i*240/(a.length-1)},${34-(v-lo)/(hi-lo||1)*30}`).join(' ')}"/></svg><small>${esc(f.series[0].date)} → ${esc(f.series.at(-1).date)} · ${lo}–${hi} ${esc(f.unit)}</small>`;}
 function render(){
  if(!data)return;
  $('#worldFeeds').innerHTML=data.feeds.map(f=>{
   const stale=f.id==='intensity'&&Date.now()-Date.parse(f.validTo)>7200000;
   const kind=f.id==='noaa'?t('noaaKind'):f.id==='intensity'?t(f.kind==='forecast'?'forecastKind':'actualKind'):f.id==='eu'?`${f.period} · CBAM`:f.kind;
   return `<section class="world-item" data-feed="${f.id}"><div class="world-item-head"><h3>${t(f.id+'Title')}</h3><span class="feed-tier">${t(stale?'stale':f.tier)}</span></div><div class="world-value">${f.value==null?'—':fmt(f.value,f.id==='intensity'?0:2)} <small>${esc(f.unit)}</small></div><p>${esc(kind)} · ${esc(f.cadence)}</p>${spark(f)}<p class="world-source"><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.source)} ↗</a><br>${t('sourceDate')}: ${date(f.observedAt)}<br>${t('fetchedAt')}: ${date(f.fetchedAt)}${stale?' · '+t(f.tier):''}</p></section>`;
  }).join('');
  $('#worldReference').innerHTML=`<section class="world-item"><h3>${t('footprintTitle')}</h3><div class="world-value">38.1 <small>GtCO₂ / 2025</small></div><p>${getLang()==='th'?'ค่าคาดการณ์ปี 2025 ใน GCB 2025 · ไม่ใช่ตัวนับสด':'2025 projection in GCB 2025 · not a live counter'}</p><a href="https://globalcarbonbudget.org/fossil-fuel-co2-emissions-hit-record-high-in-2025/" target="_blank" rel="noopener">Global Carbon Project ↗</a><small>${t('globalRef')} · 2025 · ${getLang()==='th'?'ตรวจแหล่งข้อมูล':'Source checked'} 26 Sep 2026</small></section><section class="world-item"><h3>${t('creditTitle')}</h3><div class="world-value">+8% <small>2025 / 2024</small></div><p>${getLang()==='th'?'87 นโยบายราคาคาร์บอน · รายรับรัฐมากกว่า US$107 พันล้านในปี 2025':'87 carbon pricing policies · over US$107bn public revenue in 2025'}</p><a href="https://www.worldbank.org/en/news/press-release/2026/05/19/direct-carbon-pricing-covers-nearly-one-third-of-global-emissions" target="_blank" rel="noopener">World Bank · 19 May 2026 ↗</a><small>${t('globalRef')} · ${getLang()==='th'?'ตรวจแหล่งข้อมูล':'Source checked'} 26 Sep 2026</small></section>`;
 }
 async function refresh(){if(busy)return;busy=true;$('#refreshWorld').disabled=true;
  try{const r=await fetch('/api/global',{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error();const d=await r.json();if(!Array.isArray(d.feeds))throw Error();data=d;}
  catch{if(!data){try{const r=await fetch('data/world-snapshot.json');const d=await r.json();data={feeds:Object.values(d.feeds).map(f=>({...f,tier:'fallback'}))};}catch{ $('#worldFeeds').textContent=t('unavailable');}}else data.feeds=data.feeds.map(f=>({...f,tier:'fallback'}));}
  try{render();}finally{busy=false;$('#refreshWorld').disabled=false;}
 }
 $('#refreshWorld').onclick=refresh;fetch('data/world-snapshot.json').then(r=>r.json()).then(d=>{if(!data){data={feeds:Object.values(d.feeds).map(f=>({...f,tier:'fallback'}))};render();}}).catch(()=>{});refresh();setInterval(()=>{if(!document.hidden)refresh();},300000);
 return {render};
}
