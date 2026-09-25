// Fixed public upstreams only. This is not a URL proxy; user inputs never leave the browser.
export const SOURCES={
 noaa:{url:'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_trend_gl.txt',source:'NOAA GML',cadence:'daily',unit:'ppm',ttl:21600},
 intensity:{url:'https://api.carbonintensity.org.uk/intensity',source:'NESO Carbon Intensity API',cadence:'30 min',unit:'gCO₂/kWh',ttl:900},
 rggi:{url:'https://www.rggi.org/auctions/auction-results',source:'RGGI',cadence:'quarterly auction',unit:'USD / short ton allowance',ttl:21600},
 eu:{url:'https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en',source:'European Commission',cadence:'quarterly reference',unit:'EUR / tCO₂e',ttl:21600}
};
const finite=(n,min=0,max=1e9)=>{if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw Error('Invalid upstream value');return n;};
const text=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/\s+/g,' ').trim();
const cells=s=>[...s.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>text(m[1]));
export function parseFeed(id,body){
 if(id==='noaa'){
  const rows=body.split('\n').filter(l=>/^\s*\d{4}\s+/.test(l)).map(l=>l.trim().split(/\s+/));
  const a=rows.at(-1);if(!a||a.length!==5)throw Error('NOAA schema changed');
  const date=`${a[0]}-${a[1].padStart(2,'0')}-${a[2].padStart(2,'0')}`;
  return {value:finite(Number(a[4]),250,600),observedAt:date,kind:'deseasonalized trend',series:rows.slice(-30).map(r=>({date:`${r[0]}-${r[1].padStart(2,'0')}-${r[2].padStart(2,'0')}`,value:finite(Number(r[4]),250,600)}))};
 }
 if(id==='intensity'){
  const d=JSON.parse(body).data?.[0];if(!d||!Number.isFinite(Date.parse(d.from))||!Number.isFinite(Date.parse(d.to)))throw Error('Intensity schema changed');
  const actual=d.intensity?.actual;const forecast=d.intensity?.forecast;
  return {value:finite(actual??forecast,0,1500),observedAt:d.from,validTo:d.to,kind:actual==null?'forecast':'estimated actual'};
 }
 if(id==='rggi'){
  const rows=[...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>cells(m[1])).filter(c=>/^Auction \d+$/.test(c[0])&&/^\d{4}-\d{2}-\d{2}$/.test(c[1])&&/^\$[\d.,]+$/.test(c[5]||''));
  if(!rows.length)throw Error('RGGI schema changed');rows.sort((a,b)=>b[1].localeCompare(a[1]));const r=rows[0];
  return {value:finite(Number(r[5].replace(/[$,]/g,'')),0,1000),observedAt:r[1],kind:r[0],volume:finite(Number(r[4].replaceAll(',',''))),series:rows.slice(0,6).reverse().map(a=>({date:a[1],value:Number(a[5].replace(/[$,]/g,''))}))};
 }
 if(id==='eu'){
  const rows=[...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>cells(m[1])).filter(c=>/^Q[1-4] \d{4}$/.test(c[0])&&/^\d+,\d+$/.test(c[2]||''));
  if(!rows.length)throw Error('EU schema changed');rows.sort((a,b)=>a[0].slice(3).localeCompare(b[0].slice(3))||a[0].localeCompare(b[0]));const r=rows.at(-1);
  const date=new Date(r[1]+' UTC');if(!Number.isFinite(date.getTime()))throw Error('EU date');
  return {value:finite(Number(r[2].replace(',','.')),0,1000),observedAt:date.toISOString().slice(0,10),period:r[0],kind:'CBAM reference; not an EUA spot quote'};
 }
 throw Error('Unknown feed');
}
export async function collectWorld({fetcher=fetch,cache=null,origin='https://carbon.nonarkara.org',snapshot={},now=Date.now(),waitUntil=()=>{}}={}){
 const feeds=await Promise.all(Object.entries(SOURCES).map(async([id,cfg])=>{
  const key=new Request(`${origin}/api/cache/world-${id}`);let prior=null;
  try{prior=await cache?.match(key).then(r=>r?.json());}catch{}
  const meta={id,source:cfg.source,url:cfg.url,cadence:cfg.cadence,unit:cfg.unit};
  if(prior&&now-Date.parse(prior.fetchedAt)<cfg.ttl*1000)return {...prior,tier:'cache'};
  try{
   const r=await fetcher(cfg.url,{headers:{Accept:id==='intensity'?'application/json':'text/plain,text/html','User-Agent':'ForestCarbonThailand/0.2 (+https://carbon.nonarkara.org)'},signal:AbortSignal.timeout(8000)});
   if(!r.ok)throw Error('Upstream HTTP '+r.status);
   const body=await r.text();if(body.length>2000000)throw Error('Upstream too large');
   const value={...meta,...parseFeed(id,body),tier:'fetched',fetchedAt:new Date(now).toISOString()};
   if(!Number.isFinite(Date.parse(value.observedAt))||(/^\d{4}-\d{2}-\d{2}$/.test(value.observedAt)&&new Date(value.observedAt).toISOString().slice(0,10)!==value.observedAt)||Date.parse(value.observedAt)>now+86400000)throw Error('Future observation');
   if(cache)waitUntil(cache.put(key,Response.json(value,{headers:{'Cache-Control':'public, max-age=2592000'}})));
   return value;
  }catch{
   const old=prior||snapshot[id];return old?{...old,...meta,tier:'fallback',error:'upstream unavailable'}:{...meta,value:null,observedAt:null,fetchedAt:null,tier:'unavailable'};
  }
 }));
 return {schemaVersion:1,checkedAt:new Date(now).toISOString(),feeds};
}
