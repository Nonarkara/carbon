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
import {collectLaw,chromeCost,LAW_VIEWPORTS,CHROME_LIMIT_PCT,EQUAL_WEIGHT_EXEMPTIONS} from './lib/msh-law.mjs';
import {assertProjectServer} from './lib/server-identity.mjs';
import {measurementTarget} from './lib/local-server.mjs';
import {measureWithRecovery} from './lib/browser-resilience.mjs';
import {openCollapsibles, measureFolds} from './lib/folds.mjs';

const OUT='test-results/spatial';

// No server? Start this project's own, on a port this process chose. The gate must be
// runnable as a single command on any machine, and must never measure whatever else happens
// to hold the default port.
const target=await measurementTarget();
const base=target.base;

// Before anything is measured: prove the server under the cursor is THIS project. A gate
// pointed at another app on the same port reported a missing element as if it were a layout
// failure. Measuring the wrong build and calling it a finding is worse than measuring nothing.
const manifest=await assertProjectServer(base);
console.log(`measuring ${manifest.commit} at ${base}`);

// The surfaces and widths where a spatial failure actually occurred, plus the surfaces this
// project changed most recently.
//
// The widths are the ones docs/MSH.md names: 390, 1024 and 1440. The old matrix used 320 and 768
// and skipped 1024 entirely, so the width where the layout actually changes was the one width
// nobody measured. 320 and 768 are kept as extra coverage — a narrower phone is still a phone.
const MATRIX=[
 {name:'home',path:'?lang=th',ready:'#kStock',widths:[320,390,1024,1440]},
 {name:'sea',path:'sea.html?lang=th',ready:'body[data-ready]',widths:[320,390,1024,1440]},
 {name:'bible',path:'bible.html?lang=th#sea-overview',ready:'.prose',widths:[320,390,1024,1440]},
 {name:'bible-credits',path:'bible.html?lang=en#sea-what-is-a-credit',ready:'figure.credit-figure',widths:[320,390,1024,1440]},
 {name:'guide-th',path:'guide-th.html',ready:'.manual-routes',widths:[320,390,1024,1440]},
 {name:'guide-en',path:'guide-en.html',ready:'.manual-routes',widths:[320,390,1024,1440]},
 {name:'research-th',path:'research-th.html',ready:'.research-intro',widths:[320,390,1024,1440]},
 {name:'research-en',path:'research-en.html',ready:'.research-intro',widths:[320,390,1024,1440]},
 // Every surface the site ships is measured. A page nobody measured is a page nobody knows
 // the state of: the 404 a reader lands on after a dead link, the English workbench, and the
 // Bible on the narrowest phone.
 {name:'not-found',path:'404.html',ready:'h1',widths:[320,390,1024,1440]},
 {name:'sea-en',path:'sea.html?lang=en',ready:'body[data-ready]',widths:[320,390,1024,1440]},
 {name:'home-en',path:'?lang=en',ready:'#kStock',widths:[320,390,1024,1440]},
];
// The law names the height for each width. The height at 1024 is recorded, as section 6 asks.
const HEIGHT=width=>width<=390?844:(width<=1024?768:900);

let browser=await chromium.launch();
let page=await browser.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await mkdir(OUT,{recursive:true});
const findings=[];
// The chrome cost of every surface at every viewport, recorded as the law's section 6 asks.
const chrome=[];
// What the reader's first screen actually shows, recorded per the law's section 6.
const firstScreen=[];

async function measureSurface(s,width){
  const height=HEIGHT(width);
  await page.setViewportSize({width,height});
  // Load, then wait for the surface's own readiness signal. Both are retried once: a page
  // that is slow because the MACHINE is busy is not a page with a layout defect, and a gate
  // that blocks a release on a slow load is a gate people learn to bypass. The retry separates
  // a transient stall from a surface that never renders.
  let ready=false,lastErr=null;
  for(let attempt=0;attempt<2&&!ready;attempt++){
   try{
    await page.goto(`${base}/${s.path}`,{waitUntil:'domcontentloaded',timeout:20000});
    await page.locator(s.ready).first().waitFor({timeout:10000});
    ready=true;
   }catch(e){
    lastErr=e;
    if(attempt===0)await page.waitForTimeout(1000);
   }
  }
  if(!ready)assert.fail(`${s.name}@${width} never became ready: ${lastErr?.message}`);
  // A fold that hides content must not hide it from the law. The folds are opened first,
  // so the geometry measured is the geometry the reader reaches when they open it.
  await openCollapsibles(page);
  await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))]));
  await page.waitForTimeout(80);

  const offenders=await page.evaluate(`(${collectSpatial.toString()})()`);
  for(const o of offenders)findings.push({surface:s.name,width,...o});

  // The law's own classes: chrome cost and the five symptoms the geometry collector cannot see.
  const law=await page.evaluate(`(${collectLaw.toString()})(null,${JSON.stringify(EQUAL_WEIGHT_EXEMPTIONS)})`);
  for(const o of law)findings.push({surface:s.name,width,...o});

  // Chrome cost is RECORDED for every viewport, as section 6 of the law requires, whether or not
  // it fails. A large footprint is a prompt to investigate, not a universal numeric failure.
  const cost=await page.evaluate(`(${chromeCost.toString()})(document)`);
  chrome.push({surface:s.name,width,height,...cost});
  if(cost.totalPct>CHROME_LIMIT_PCT){
   findings.push({surface:s.name,width,kind:'giant-top-bar',severity:'medium',el:'chrome',gap:cost.totalPx,
    note:`chrome takes ${cost.totalPct}% of the viewport (${cost.topPx}px top + ${cost.bottomPx}px bottom of ${height}px)`});
  }

  // TASK VISIBILITY. The law asks whether the primary information and the primary action are
  // visible together, and what content earns any scrolling. This records where the first
  // readable thing and the first usable control actually are, in the first screen.
  const first=await page.evaluate(()=>{
   const col=document.querySelector('.reading')||document.querySelector('#article')||document.querySelector('.research-layout')
    ||document.querySelector('.stage')||document.querySelector('main')||document.body;
   const inView=e=>{
    const cs=getComputedStyle(e);
    if(cs.display==='none'||cs.visibility==='hidden')return false;
    const r=e.getBoundingClientRect();
    return r.height>=4&&r.width>=4&&r.bottom>0&&r.top<innerHeight;
   };
   let text=null,action=null;
   for(const e of col.querySelectorAll('p,h1,h2,h3,li,td,th,label,b,strong,span')){
    if(!inView(e))continue;
    if(!e.textContent.trim())continue;
    const r=e.getBoundingClientRect();
    if(!text||r.top<text.top)text={top:r.top,left:r.left,text:e.textContent.trim().slice(0,36)};
   }
   // The action is looked for across the WHOLE page, not only inside the content column: a
   // reading chapter's first screen is prose, and the reader's way forward is the header's
   // navigation and the index beside the text. Demanding a button inside the prose would
   // condemn a correct reading layout.
   for(const e of document.querySelectorAll('button,a[href],input,select,summary,[role=button]')){
    if(!inView(e))continue;
    const r=e.getBoundingClientRect();
    if(!action||r.top<action.top)action={top:r.top,left:r.left,text:(e.textContent||e.value||'').trim().slice(0,36)};
   }
   return {
    vh:innerHeight,
    textTop:text?Math.round(text.top):null,text:text?text.text:null,
    actionTop:action?Math.round(action.top):null,action:action?action.text:null,
    actionLeft:action?Math.round(action.left):null,
   };
  });
  firstScreen.push({surface:s.name,width,height,...first});
  assert.ok(first.textTop!==null,`${s.name}@${width}: the first screen holds no readable content`);
  assert.ok(first.actionTop!==null,`${s.name}@${width}: the first screen offers no way to act`);

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

  // The map's credit line must be visible on the screen, not hidden under the fixed bottom bar.
  //
  // The general overlapping-chrome rule cannot see this one: the page can still scroll a couple
  // of pixels, so the credit is technically reachable — but the reader's FIRST view of the map
  // showed nothing but the nav, and the OpenStreetMap credit was both invisible and unclickable.
  // A named property is asserted here, the way this gate already asserts the research byline and
  // the comparison table, because this defect is specific and worth keeping specific.
  if(s.name==='home'&&width<=700){
   const credit=await page.evaluate(()=>{
    const attr=document.querySelector('.leaflet-control-attribution');
    if(!attr)return {missing:true};
    const nav=document.querySelector('nav.bottom-nav');
    const a=attr.getBoundingClientRect();
    const n=nav?nav.getBoundingClientRect():null;
    const link=attr.querySelector('a');
    const lb=link?link.getBoundingClientRect():null;
    const hit=lb?document.elementFromPoint(lb.left+Math.min(lb.width/2,8),lb.top+lb.height/2):null;
    return {
     missing:false,
     top:Math.round(a.top),bottom:Math.round(a.bottom),
     navTop:n?Math.round(n.top):null,
     covered:n?a.bottom>n.top:false,
     reachable:hit?link.contains(hit)||hit===link:false,
    };
   });
   assert.ok(!credit.missing,`${s.name}@${width}: the map lost its attribution`);
   assert.ok(!credit.covered,`${s.name}@${width}: the fixed bottom nav covers the map attribution (attribution bottom ${credit.bottom}, nav top ${credit.navTop})`);
   assert.ok(credit.reachable,`${s.name}@${width}: the map attribution is not clickable`);
  }

  // A fold has to be one line. A fold that is three lines has put the navigation back
  // where it started and the page is no better off than before the fold existed.
  const folds=await measureFolds(page);
  for(const f of folds){
   assert.ok(f.foldedHeight<=96,`${s.name}@${width}: the folded ${f.id} takes ${f.foldedHeight}px (${f.lines} lines) — a fold must be one line`);
   assert.ok(f.openHeight>=200,`${s.name}@${width}: the folded ${f.id} opens to ${f.openHeight}px — there is nothing behind it`);
  }

  // The research byline is a travelling rail, not a stranded block in an empty column.
  if(s.name.startsWith('research')){
   const sticky=await page.evaluate(()=>{
    const e=document.querySelector('.research-intro .research-byline');
    return e?getComputedStyle(e).position:null;
   });
   assert.equal(sticky,'sticky',`${s.name}@${width} research byline is ${sticky}, not sticky`);
  }
 }

// A browser can die mid-gate — most often because the machine ran out of memory while other
// work was running. That is not a layout finding, and it must not end the gate: the browser
// is relaunched and the surface is measured again. If it dies twice, the surface could not be
// measured at all, and that IS a failure the gate must report, not absorb. The rule lives in
// scripts/lib/browser-resilience.mjs and is tested there.
async function relaunch(){
 try{await browser.close();}catch{}
 browser=await chromium.launch();
 page=await browser.newPage();
 page.on('pageerror',e=>errors.push(e.message));
}
for(const s of MATRIX){
 for(const width of s.widths){
  await measureWithRecovery({surface:s,width},{
   measure:job=>measureSurface(job.surface,job.width),
   relaunch,
   record:(job,err)=>assert.fail(`the browser died twice measuring ${job.surface}@${job.width}: the surface could not be measured (${err.message})`),
  });
 }
}
await browser.close();
assert.deepEqual(errors,[],'page errors during the spatial gate');

await writeFile(`${OUT}/gate.json`,JSON.stringify({base,checkedAt:new Date().toISOString(),matrix:MATRIX,chromeCost:chrome,firstScreen,findings},null,2));
// Print the chrome cost, because the law asks for it to be recorded, not merely passed.
for(const c of chrome)console.log(`chrome ${c.surface}@${c.width}x${c.height}: top ${c.topPx}px (${c.topPct}%) bottom ${c.bottomPx}px (${c.bottomPct}%) total ${c.totalPct}%`);
if(findings.length){
 console.error(`\n${findings.length} spatial hallucination(s) found:\n`);
 for(const f of findings)console.error(`  ${f.severity.toUpperCase().padEnd(6)} ${f.kind.padEnd(16)} ${f.surface}@${f.width} ${f.el} — ${f.note}`);
 assert.fail(`${findings.length} spatial hallucination(s) found`);
}
// The measurement is done. Release the server this gate started, so the port is free and
// nothing is left listening after the gate ends.
await target.stop();
console.log(`PASS spatial gate: ${MATRIX.length} surfaces, ${MATRIX.reduce((a,s)=>a+s.widths.length,0)} viewports, no unjustified gaps, orphan tracks, stranded controls, scattered actions, inflated controls, empty spacers, overlapping chrome or equal-weight blocks.`);
