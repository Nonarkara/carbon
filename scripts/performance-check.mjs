// Repeatable laboratory observation, not field Web Vitals or an accuracy certificate.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import os from 'node:os';
import {measurementTarget} from './lib/local-server.mjs';
const output=resolve(process.env.PERF_OUTPUT||'test-results/performance');
await mkdir(output,{recursive:true});
const target=await measurementTarget();
const browser=await chromium.launch();
const rows=[];
try {
 for(const [name,path,ready] of [['thailand','/?lang=th','#kStock'],['sea','/sea?lang=th&metric=forest_pct','#seaMap'],['bible','/bible.html?lang=th','#article h1'],['research','/research-th.html','.research-layout']]){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await context.addInitScript(()=>{window.__perf={lcp:null,cls:0,longTasks:[]};for(const type of ['largest-contentful-paint','layout-shift','longtask'])try{new PerformanceObserver(list=>{for(const e of list.getEntries()){if(type==='largest-contentful-paint')window.__perf.lcp=e.startTime;if(type==='layout-shift'&&!e.hadRecentInput)window.__perf.cls+=e.value;if(type==='longtask')window.__perf.longTasks.push(e.duration);}}).observe({type,buffered:true});}catch{}});
  const page=await context.newPage();
  for(const cache of ['cold','warm']){
   const errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
   await page.goto(target.base+path,{waitUntil:'load'});
   // Main/SEA roots exist before data. Read actual useful content as well.
   if(name==='thailand')await page.waitForFunction(()=>document.querySelector('#kStock')?.textContent.includes('M'));
   else if(name==='sea')await page.locator('#seaMap .leaflet-pane').first().waitFor({state:'attached'});
   else await page.locator(ready).first().waitFor();
   await page.evaluate(()=>document.fonts.ready);
   // Fixed observation window makes before/after samples comparable; no readiness claim.
   await page.waitForTimeout(1000);
   const observed=await page.evaluate(()=>({navigation:performance.getEntriesByType('navigation').map(n=>({domContentLoaded:n.domContentLoadedEventEnd,load:n.loadEventEnd}))[0],...window.__perf,resources:performance.getEntriesByType('resource').map(r=>({url:r.name,transfer:r.transferSize,encoded:r.encodedBodySize,decoded:r.decodedBodySize,duration:r.duration}))}));
   const sameOrigin=observed.resources.filter(r=>new URL(r.url).origin===new URL(target.base).origin);const external=observed.resources.filter(r=>new URL(r.url).origin!==new URL(target.base).origin);
   rows.push({name,cache,viewport:{width:390,height:844},...observed,app:{requests:sameOrigin.length,transfer:sameOrigin.reduce((s,r)=>s+r.transfer,0),body:sameOrigin.reduce((s,r)=>s+r.encoded,0)},external:{requests:external.length,transfer:external.reduce((s,r)=>s+r.transfer,0)},errors});
   page.off('pageerror',onError);
  }
  for(const [width,height] of [[390,844],[1024,768],[1440,900]]){await page.setViewportSize({width,height});await page.screenshot({path:resolve(output,`${name}-${width}.png`)});}
  await context.close();
 }
 const receipt={checkedAt:new Date().toISOString(),commit:target.commit,base:target.base,browser:browser.version(),platform:`${os.platform()} ${os.release()} ${os.arch()}`,cpu:os.cpus()[0]?.model,profile:'Headless Chromium; no network/CPU throttling; 1s observation after actual content+fonts; cold/warm same context. External tiles/feeds separate; cross-origin transfer may be hidden by Timing-Allow-Origin.',rows};
 await writeFile(resolve(output,'metrics.json'),JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify(rows.map(({name,cache,lcp,cls,app,external,longTasks,errors})=>({name,cache,lcp,cls,app,external,longTasks:longTasks.length,errors})),null,2));
}finally{await browser.close();await target.stop();}
