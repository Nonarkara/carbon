// Spatial-geometry audit probe.
//
// Dr Non's test: "Why is this here, why this size, and why this far from that?"
// If the answer is only "the grid put it there", the layout has failed.
//
// This probe MEASURES geometry instead of judging screenshots. It uses the same collector as the
// CI gate, so an audit and a gate can never disagree about what counts as a spatial hallucination.
//
// Output: a JSON report of offenders per surface and viewport, plus a console summary.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {SURFACES,collectSpatial} from './lib/spatial-collector.mjs';

const base=process.env.BASE_URL||'http://127.0.0.1:8788';
const OUT='test-results/spatial';
const WIDTHS=(process.env.SPATIAL_WIDTHS||'320,390,700,768,1024,1440').split(',').map(Number);

const browser=await chromium.launch();
const page=await browser.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await mkdir(OUT,{recursive:true});
const report=[];

for(const s of SURFACES){
 for(const width of WIDTHS){
  await page.setViewportSize({width,height:width<=390?700:900});
  console.error(`probe ${s.name}@${width}`);
  try{await page.goto(`${base}/${s.path}`,{waitUntil:'domcontentloaded',timeout:15000});}catch(e){report.push({surface:s.name,width,error:'goto failed: '+e.message});continue;}
  try{await page.locator(s.ready).first().waitFor({timeout:8000});}catch{report.push({surface:s.name,width,error:'ready selector never appeared: '+s.ready});continue;}
  // document.fonts.ready can hang forever when a webfont never settles, so it is raced against a clock.
  await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))]));
  await page.waitForTimeout(80);
  const offenders=await page.evaluate(`(${collectSpatial.toString()})()`);
  const keyTop=await page.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return null;return Math.round(e.getBoundingClientRect().top+window.scrollY);},s.key);
  const docH=await page.evaluate(()=>document.documentElement.scrollHeight);
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))offenders.push({kind:'horizontal-overflow',severity:'high',el:'document',gap:0,note:'page scrolls sideways'});
  report.push({surface:s.name,width,keyTop,docHeight:docH,offenders});
 }
}

await writeFile(`${OUT}/report.json`,JSON.stringify({base,checkedAt:new Date().toISOString(),report,pageErrors:errors},null,2));
await browser.close();

const counts={};
let total=0;
for(const r of report){
 for(const o of (r.offenders||[])){
  counts[o.kind]=(counts[o.kind]||0)+1;total++;
  console.log(`${o.severity.toUpperCase().padEnd(6)} ${o.kind.padEnd(16)} ${r.surface}@${r.width} ${o.el} — ${o.note}`);
 }
}
console.log('\n'+JSON.stringify({total,byKind:counts,surfaces:SURFACES.length,widths:WIDTHS.length},null,2));
if(errors.length)console.log('PAGE ERRORS:',errors);
