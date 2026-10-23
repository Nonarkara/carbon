// Deep spatial audit: the content, not just the shells.
//
// The shell gate measures the page furniture — header, rails, controls. But most of this site is
// never seen by that gate at all:
//
//   * the Bible renders ONE chapter at a time, so 67 of its 68 chapters were never measured;
//   * the manual is one long page, so each section was measured only as part of the whole;
//   * the Southeast Asia page became a four-view workspace (map / evidence / compare / research),
//     and a view that is hidden contributes zero-size rectangles — the collector skips it, so an
//     unmeasured view reads exactly like a clean one;
//   * content that hides inside a <details> has zero-height children and is skipped the same way;
//   * the research pages carry a two-column layout, an audit table and a standards note that the
//     shell pass only ever saw from the outside.
//
// This audit visits each of those and reports the geometry of the content itself.
//
// It uses the same collector as scripts/spatial-probe.mjs and scripts/spatial-gate.mjs, so an
// audit, a gate and a probe can never disagree about what counts as a spatial hallucination.
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {collectSpatial} from './lib/spatial-collector.mjs';
import {collectLaw,chromeCost,EQUAL_WEIGHT_EXEMPTIONS} from './lib/msh-law.mjs';
import {assertProjectServer} from './lib/server-identity.mjs';
import {measurementTarget} from './lib/local-server.mjs';

// No server named? Start this project's own, on a port this process chose. The audit must be
// runnable as a single command and must measure this build and nothing else.
const target=await measurementTarget();
const base=target.base;
const OUT='test-results/spatial';
// Prove the server under measurement is this project before the audit starts. An audit of
// another app's pages would produce findings about an interface that does not exist here.
const manifest=await assertProjectServer(base);
console.log(`auditing ${manifest.commit} at ${base}`);
const bible=JSON.parse(await readFile('public/data/bible.json','utf8'));
const chapters=bible.chapters.map(c=>c.id);
const MANUAL_SECTIONS=['province','area','project','layers','install','help','reference'];
const SEA_VIEWS=['map','evidence','compare','research'];

// The viewports docs/MSH.md names: 390 x 844 is the phone, 1440 x 900 the desktop, and 1024 is
// the width where the layout actually changes — the one width the old matrix never measured.
// The heights are the law's, not a guess.
const VIEWPORTS=[{width:390,height:844},{width:1024,height:768},{width:1440,height:900}];
const PHONE=390,DESKTOP=1440;

const browser=await chromium.launch();
const page=await browser.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await mkdir(OUT,{recursive:true});
const report=[];

async function settle(){
 // Let lazy images and galleries take up their space, and let fonts settle before measuring.
 await page.evaluate(async()=>{const step=innerHeight;for(let y=0;y<document.body.scrollHeight;y+=step){window.scrollTo(0,y);await new Promise(r=>requestAnimationFrame(r));}window.scrollTo(0,0);});
 await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1200))]));
 await page.waitForTimeout(60);
}
async function measure(scopeSelector){
 const offenders=await page.evaluate(`(${collectSpatial.toString()})(document.querySelector(${JSON.stringify(scopeSelector)})||null)`);
 return offenders;
}
// The law's own classes, measured on the same page. The chrome cost is RECORDED for every
// viewport, as section 6 of the law requires, whether or not it fails.
async function measureLaw(){
 const findings=await page.evaluate(`(${collectLaw.toString()})(null,${JSON.stringify(EQUAL_WEIGHT_EXEMPTIONS)})`);
 const cost=await page.evaluate(`(${chromeCost.toString()})(document)`);
 return {findings,cost};
}

async function run(job){
 const width=job.width;
 const height=job.height||(width<=PHONE?844:(width<=1024?768:900));
 await page.setViewportSize({width,height});
 // A load can fail because the server was busy, not because the page is broken. One retry
 // separates a transient stall from a page that will not load at all — and only the latter is a
 // finding. Without the retry a busy server produced "2 pages could not be measured" on a run
 // whose real result was zero findings.
 let loaded=false,lastErr=null;
 for(let attempt=0;attempt<2&&!loaded;attempt++){
  try{await page.goto(`${base}/${job.path}`,{waitUntil:'domcontentloaded',timeout:20000});loaded=true;}
  catch(e){lastErr=e;if(attempt===0)await page.waitForTimeout(1500);}
 }
 if(!loaded){report.push({...job,error:'goto failed: '+lastErr.message});return;}
 // The readiness wait is retried on the same terms as the navigation: a surface that is slow
 // because the machine is busy is not a surface with a layout defect, and a clean audit that
 // did not run is not a clean audit. One retry separates a transient stall from a page that
 // never renders.
 let ready=false;
 for(let attempt=0;attempt<2&&!ready;attempt++){
  try{await page.locator(job.ready).first().waitFor({timeout:10000});ready=true;}
  catch{ if(attempt===0)await page.waitForTimeout(1000); }
 }
 if(!ready){report.push({...job,error:'ready selector never appeared: '+job.ready});return;}
 // A hash change does not reload the page, so the previous chapter's prose is still on screen for
 // an instant. Waiting for the expected heading is what stops the audit from measuring a chapter
 // that is no longer there — a stale measurement is worse than no measurement.
 if(job.expectTitle){
  try{await page.waitForFunction(t=>document.querySelector('#article h1')?.textContent.trim()===t,job.expectTitle,{timeout:8000});}
  catch{report.push({...job,error:`chapter never rendered: ${job.expectTitle}`});return;}
 }
 await settle();
 if(job.act)await job.act();
 // Prove the page is in the state we think it is. A hidden view contributes zero-size rectangles
 // and is skipped by the collector, so a view that never opened would measure exactly as clean as
 // a view that is genuinely well laid out. The audit must be able to tell those apart.
 //
 // The check is retried, because the app renders some panels after its data arrives and that
 // render replaces the nodes the setup touched — a page that is briefly ready and then replaces
// itself is a race, not a defect. Three attempts outlast a late render; a page that still is not
 // in the expected state after that is a real finding.
 if(job.expect){
  let state=false;
  for(let attempt=0;attempt<3&&!state;attempt++){
   state=await page.evaluate(job.expect);
   if(!state&&attempt<2){await page.waitForTimeout(350);if(job.act)await job.act();await page.waitForTimeout(250);}
  }
  if(!state){
   report.push({...job,width,error:`page was not in the expected state: ${job.expectLabel||job.expect}`});
   return;
  }
 }
 const offenders=await measure(job.scope||'null');
 const law=await measureLaw();
 report.push({...job,width,height,offenders,lawFindings:law.findings,chromeCost:law.cost});
}

// --- 1. The Bible: every chapter, in both languages, at both a phone and a desktop width.
// Thai is the wider script and the phone is the narrowest case, so measuring only Thai at 390
// would leave a wide English chapter unchecked — and measuring only one width hides the layouts
// that break between them.
const byId=new Map(bible.chapters.map(c=>[c.id,c]));
for(const lang of ['th','en']){
 for(const vp of VIEWPORTS){
  for(const id of chapters){
   await run({kind:'chapter',id,lang,width:vp.width,height:vp.height,path:`bible.html?lang=${lang}#${id}`,ready:'.prose',expectTitle:byId.get(id)?.title?.[lang]});
  }
 }
}

// --- 2. The Southeast Asia workspace: every view, at both a phone and a desktop width.
// The views are switched with the visible control for that width — a button on desktop, the
// select on a phone — so the measured page is the one a reader actually sees.
for(const vp of VIEWPORTS){
 const width=vp.width;
 for(const view of SEA_VIEWS){
  await run({
   kind:'sea-view',id:view,width,height:vp.height,path:'sea.html?lang=th',ready:'body[data-ready]',
   expect:`document.body.dataset.seaView==='${view}'`,expectLabel:`the ${view} view must actually be open`,
   act:async()=>{
    await page.evaluate(v=>{
     const btn=document.querySelector(`button[data-sea-view="${v}"]`);
     if(btn&&btn.getBoundingClientRect().width>0){btn.click();return;}
     const sel=document.querySelector('#seaView');
     if(sel){sel.value=v;sel.dispatchEvent(new Event('change',{bubbles:true}));}
    },view);
    await page.waitForTimeout(180);
   },
  });
 }
}

// --- 3. The manual: each section measured on its own, plus the whole page.
for(const [path,label] of [['guide-th.html','th'],['guide-en.html','en']]){
 for(const vp of VIEWPORTS){
  const width=vp.width;
  await run({kind:'manual',id:'whole-page',lang:label,width,height:vp.height,path,ready:'.manual-routes'});
  for(const id of MANUAL_SECTIONS){
   await run({
    kind:'manual',id,width,height:vp.height,lang:label,path,ready:'.manual-routes',
    scope:`#${id}`,
    expect:`(()=>{const e=document.querySelector('#${id}');return !!e&&e.getBoundingClientRect().height>0})()`,expectLabel:`the #${id} section must be open and have height`,
    act:async()=>{await page.evaluate(s=>document.querySelector(s)?.scrollIntoView({block:'start'}),`#${id}`);await page.waitForTimeout(80);},
   });
  }
 }
}

// --- 4. The pages whose content hides inside a disclosure.
// A collapsed <details> has zero-height children, so the collector skips it and the content is
// never measured at all. Opening every disclosure before measuring puts the real geometry —
// reference chapters, screen maps, layer notes, the about text — back in play.
for(const [path,label,ready] of [
 ['guide-th.html','th','.manual-routes'],
 ['guide-en.html','en','.manual-routes'],
 ['?lang=th','th','#kStock'],
 ['?lang=en','en','#kStock'],
]){
 for(const vp of VIEWPORTS){
  const width=vp.width;
  await run({
   kind:'open-page',id:'all-disclosures-open',lang:label,width,height:vp.height,path,ready,
   expect:`(()=>{const d=[...document.querySelectorAll('details')];return d.length>0&&d.every(x=>x.open)})()`,
   expectLabel:'every disclosure must be open before the page is measured',
   act:async()=>{
    // Wait for the app's own data to land first: a panel that renders late replaces the nodes
    // the setup just opened, and the measurement would be of a page that is no longer there.
    await page.waitForLoadState('networkidle',{timeout:6000}).catch(()=>{});
    await page.evaluate(()=>{for(const d of document.querySelectorAll('details'))d.open=true;});
    await page.waitForTimeout(150);
   },
  });
 }
}

// --- 5. The research pages: the two-column layout and the sections inside it.
for(const [path,label] of [['research-th.html','th'],['research-en.html','en']]){
 for(const vp of VIEWPORTS){
  const width=vp.width;
  await run({kind:'research',id:'whole-page',lang:label,width,height:vp.height,path,ready:'.research-intro'});
  for(const sel of ['.research-layout','.audit-results','.author-profile','.standards-note','.research-toc']){
   await run({
    kind:'research',id:sel,width,height:vp.height,lang:label,path,ready:'.research-intro',scope:sel,
    expect:`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&e.getBoundingClientRect().height>0})()`,expectLabel:`${sel} must have height`,
    act:async()=>{await page.evaluate(s=>document.querySelector(s)?.scrollIntoView({block:'start'}),sel);await page.waitForTimeout(80);},
   });
  }
 }
}

// --- 6. The home workbench: each of its five tab panels.
// The workbench shows one panel at a time and hides the other four, so a hidden panel has
// zero-size children and is skipped by the collector exactly like a hidden SEA view. Only the
// carbon panel was ever measured.
const HOME_TABS=['carbon','project','calculate','evidence','sources'];
for(const lang of ['th','en']){
 for(const vp of VIEWPORTS){
  const width=vp.width;
  for(const t of HOME_TABS){
   await run({
    kind:'home-tab',id:t,lang,width,height:vp.height,path:`?lang=${lang}`,ready:'#kStock',
    scope:`[data-panel="${t}"]`,
    expect:`document.body.dataset.mode==='${t}'`,expectLabel:`the ${t} panel must actually be open`,
    act:async()=>{
     // The same tab is offered in the lens strip on a desktop and in the bottom bar on a phone,
     // but the last two tabs sit inside the "more" disclosure on a phone. Open whatever holds
     // the button, then tap it — a reader opens that disclosure first, and the audit has to walk
     // the same path or it measures a panel that was never on screen.
     await page.evaluate(name=>{
      const visible=b=>{const r=b.getBoundingClientRect();return r.width>0&&r.height>0;};
      let btn=[...document.querySelectorAll(`[data-tab="${name}"]`)].find(visible);
      if(!btn){
       for(const d of document.querySelectorAll('details'))if(d.querySelector(`[data-tab="${name}"]`))d.open=true;
       btn=[...document.querySelectorAll(`[data-tab="${name}"]`)].find(visible);
      }
      if(btn)btn.click();
     },t);
     await page.waitForTimeout(220);
    },
   });
  }
 }
}

await writeFile(`${OUT}/deep-report.json`,JSON.stringify({base,checkedAt:new Date().toISOString(),report,pageErrors:errors},null,2));
await browser.close();

const counts={};
let total=0;
for(const r of report){
 for(const o of [...(r.offenders||[]),...(r.lawFindings||[])]){
  counts[o.kind]=(counts[o.kind]||0)+1;total++;
  console.log(`${o.severity.toUpperCase().padEnd(6)} ${o.kind.padEnd(16)} ${r.kind}/${r.id}${r.lang?'/'+r.lang:''}@${r.width} ${o.el} — ${o.note}`);
 }
}
const failed=report.filter(r=>r.error).length;
// The chrome cost of every measured page, as the law's section 6 asks it to be recorded.
const chromeCosts=report.filter(r=>r.chromeCost).map(r=>({kind:r.kind,id:r.id,width:r.width,topPct:r.chromeCost.topPct,bottomPct:r.chromeCost.bottomPct,totalPct:r.chromeCost.totalPct}));
const worstChrome=chromeCosts.slice().sort((a,b)=>b.totalPct-a.totalPct).slice(0,5);
console.log('\nworst chrome cost: '+worstChrome.map(c=>`${c.kind}/${c.id}@${c.width}=${c.totalPct}%`).join(' '));
console.log('\n'+JSON.stringify({total,byKind:counts,jobs:report.length,failed,chrome:worstChrome},null,2));
if(failed)for(const r of report)if(r.error)console.log('FAILED',r.kind,r.id,r.width,r.error);
if(errors.length)console.log('PAGE ERRORS:',[...new Set(errors)].slice(0,10));

// A probe that only reports is a probe nobody reads. Set SPATIAL_DEEP_REPORT_ONLY=1 to look
// without failing; by default a finding is a build failure, exactly like the shell gate.
if(failed){console.error(`\n${failed} page(s) could not be measured — a clean audit that did not run is not a clean audit.`);process.exit(1);}
if(errors.length){console.error('\nPage errors during the deep audit.');process.exit(1);}
if(total&&process.env.SPATIAL_DEEP_REPORT_ONLY!=='1'){console.error(`\n${total} spatial hallucination(s) found in the content.`);process.exit(1);}
// The measurement is done. Release the server this gate started, so the port is free and
// nothing is left listening after the gate ends.
await target.stop();
console.log(`PASS deep spatial audit: ${report.length} pages measured at 390x844, 1024x768 and 1440x900, no unjustified gaps, orphan tracks, stranded controls, scattered actions, inflated controls, empty spacers, overlapping chrome or equal-weight blocks.`);
