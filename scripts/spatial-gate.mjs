// CI gate for spatial hallucinations.
//
// Dr Non's rule: "Why is this here, why this size, and why this far from that?"
// If the answer is only "the grid put it there", the layout has failed.
//
// This gate measures the live layout and fails the build when the geometry explains itself with
// the grid instead of with the reader. It uses the same collector as scripts/spatial-probe.mjs, so
// the audit and the gate can never drift apart.
//
// Beyond the generic measurement it also asserts the specific properties the 2026-10-21 massacre
// established, so a regression in the fix is caught even if the collector's rules are later retuned:
//   * a control strip never strands a single short item on a line of its own;
//   * the research byline stays with the reader instead of sitting in an empty rail;
//   * the SEA comparison table never pushes the page sideways.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {collectSpatial} from './lib/spatial-collector.mjs';

const base=process.env.BASE_URL||'http://127.0.0.1:8788';
const OUT='test-results/spatial';

// The surfaces and widths where a spatial failure actually occurred, plus the surfaces this
// project changed most recently.
const MATRIX=[
 {name:'home',path:'?lang=th',ready:'#kStock',widths:[320,768,1440]},
 {name:'sea',path:'sea.html?lang=th',ready:'#countryRows tr',widths:[320,390,768,1440]},
 {name:'bible',path:'bible.html?lang=th#sea-overview',ready:'.prose',widths:[390,1440]},
 {name:'bible-credits',path:'bible.html?lang=en#sea-what-is-a-credit',ready:'.figure-stack',widths:[390,1440]},
 {name:'guide-th',path:'guide-th.html',ready:'.manual-routes',widths:[320,390,768]},
 {name:'guide-en',path:'guide-en.html',ready:'.manual-routes',widths:[320,390,768]},
 {name:'research-th',path:'research-th.html',ready:'.research-intro',widths:[320,768,1440]},
 {name:'research-en',path:'research-en.html',ready:'.research-intro',widths:[320,768,1440]},
];

const browser=await chromium.launch();
const page=await browser.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await mkdir(OUT,{recursive:true});
const findings=[];

for(const s of MATRIX){
 for(const width of s.widths){
  await page.setViewportSize({width,height:width<=390?700:900});
  try{await page.goto(`${base}/${s.path}`,{waitUntil:'domcontentloaded',timeout:15000});}catch(e){assert.fail(`${s.name}@${width} could not load: ${e.message}`);}
  await page.locator(s.ready).first().waitFor({timeout:8000});
  await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))]));
  await page.waitForTimeout(80);

  const offenders=await page.evaluate(`(${collectSpatial.toString()})()`);
  for(const o of offenders)findings.push({surface:s.name,width,...o});

  // The page must never scroll sideways.
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  assert.ok(!overflow,`${s.name}@${width} scrolls sideways`);

  // A control strip must not leave one short item alone on a line.
  const stranded=await page.evaluate(()=>{
   const out=[];
   for(const c of document.querySelectorAll('nav,header,footer,[role=toolbar],.reader-actions,.map-tools,.quick-tools')){
    const cs=getComputedStyle(c);
    if(cs.display!=='flex'&&cs.display!=='inline-flex')continue;
    const kids=[...c.children].filter(k=>k.getBoundingClientRect().height>0);
    if(kids.length<3)continue;
    if([...c.children].some(k=>k.classList&&k.classList.contains('nav-break')))continue;
    const rows=new Map();
    for(const k of kids){const t=k.getBoundingClientRect().top;const key=[...rows.keys()].find(x=>Math.abs(x-t)<=12)??t;if(!rows.has(key))rows.set(key,[]);rows.get(key).push(k);}
    for(const [key,row] of rows){
     if(row.length===1&&row[0].getBoundingClientRect().width<80)out.push({el:c.tagName+'.'+(c.className||''),text:row[0].textContent.trim().slice(0,24),width:Math.round(row[0].getBoundingClientRect().width)});
    }
   }
   return out;
  });
  assert.equal(stranded.length,0,`${s.name}@${width} strands a control on its own line: ${JSON.stringify(stranded)}`);

  // The research byline is a travelling rail, not a stranded block in an empty column.
  if(s.name.startsWith('research')){
   const sticky=await page.evaluate(()=>{
    const e=document.querySelector('.research-intro .research-byline');
    return e?getComputedStyle(e).position:null;
   });
   assert.equal(sticky,'sticky',`${s.name}@${width} research byline is ${sticky}, not sticky`);
  }
 }
}
await browser.close();
assert.deepEqual(errors,[],'page errors during the spatial gate');

await writeFile(`${OUT}/gate.json`,JSON.stringify({base,checkedAt:new Date().toISOString(),matrix:MATRIX,findings},null,2));
if(findings.length){
 console.error(`\n${findings.length} spatial hallucination(s) found:\n`);
 for(const f of findings)console.error(`  ${f.severity.toUpperCase().padEnd(6)} ${f.kind.padEnd(16)} ${f.surface}@${f.width} ${f.el} — ${f.note}`);
 assert.fail(`${findings.length} spatial hallucination(s) found`);
}
console.log(`PASS spatial gate: ${MATRIX.length} surfaces, ${MATRIX.reduce((a,s)=>a+s.widths.length,0)} viewports, no unjustified gaps, orphan tracks, stranded controls or scattered actions.`);
