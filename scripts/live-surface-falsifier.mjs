// Proof that the live verification can fail.
//
// A verification that reports "PASS" the first time it runs may simply be broken: a check
// that never fires looks exactly like a site that is fine. This breaks each published surface
// on purpose — in the browser, against the same build the release publishes — and asserts
// that the gate catches it.
//
// The assertions under test are the SHIPPED ones: they are imported from
// scripts/lib/live-surfaces.mjs, the same copy the live verification runs. A falsifier that
// tested a paraphrase of the check would prove the paraphrase.
//
// Two kinds of defect are used, because the surfaces fail in two kinds of way:
//
//   1. A DOM defect. The page renders the wrong thing: a placeholder that never arrives, a
//      headline that drifts from its own calculation, a chapter that loses its title.
//   2. A DATA defect. The page renders something true about a corpus the site no longer
//      ships. The published number and the shipped data disagree — which is the failure the
//      whole capability check exists to catch, and which no DOM defect can produce.
//
// The DOM defect is applied by a hook that re-applies itself after every render, because the
// site re-renders: a mutation that the app paints over again is not a defect, it is a race.
// The data defect is applied by intercepting the file the site serves.
//
//   node scripts/live-surface-falsifier.mjs                 against this project's own server
//   BASE_URL=https://carbon.nonarkara.org node scripts/live-surface-falsifier.mjs
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {SURFACES,assertNoSidewaysScroll,openSurface} from './lib/live-surfaces.mjs';
import {measurementTarget} from './lib/local-server.mjs';

const target=await measurementTarget();
const base=target.base;
const browser=await chromium.launch();
const page=await browser.newPage({acceptDownloads:true});

// The defect hook. It reads which defect is armed from sessionStorage, which survives the
// navigation into the surface, and re-applies it after every render the site performs.
await page.addInitScript(()=>{
 const set=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};
 const apply=()=>{
  const mode=sessionStorage.getItem('__falsifier');
  if(!mode)return;
  if(mode==='kpi-placeholder')set(document.querySelector('#kStock'),'—');
  if(mode==='kpi-drift')set(document.querySelector('#kStock'),'9,999.9 M');
  if(mode==='trace-empty')set(document.querySelector('#calculationTrace'),'no figure here');
  if(mode==='area-nounit')set(document.querySelector('#kArea'),'51.54');
  if(mode==='map-collapse'){const m=document.querySelector('#map');if(m&&m.style.height!=='100px')m.style.height='100px';}
  if(mode==='bible-count')set(document.querySelector('#count'),'60 / 68 บท');
  if(mode==='bible-truncated')set(document.querySelector('#count'),'60 / 60 บท');
  if(mode==='bible-title')set(document.querySelector('#article h1'),'');
  if(mode==='bible-body')set(document.querySelector('#article .prose'),'');
  if(mode==='bible-sources')document.querySelectorAll('#sources .source').forEach(s=>s.remove());
  if(mode==='research-toc')set(document.querySelector('.research-toc summary'),'สารบัญ · 22 บท');
  if(mode==='research-skip'){const s=document.querySelector('.skip-link');if(s&&s.getAttribute('href')!=='#section-9')s.setAttribute('href','#section-9');}
  if(mode==='guide-title')set(document.querySelector('.manual-routes a b'),'');
  if(mode==='guide-desc')set(document.querySelector('.manual-routes a span'),'');
  if(mode==='guide-route'){const list=[...document.querySelectorAll('.manual-routes a')];if(list.length===3)list[2].remove();}
  if(mode==='country-note')document.querySelectorAll('#countryNumbers div[data-number] small').forEach(s=>set(s,'no date'));
  if(mode==='head-period')set(document.querySelector('#countryHead'),'Forest area 2000');
  if(mode==='view-name')set(document.querySelector('button[data-sea-view="compare"]'),'Comparison');
  if(mode==='result-drift')set(document.querySelector('#result .result-value'),'999.87 tCO₂e');
  if(mode==='about-records')set(document.querySelector('#aboutBody [data-fig="tverCount"]'),'256');
  if(mode==='about-provinces'){
   const el=[...document.querySelectorAll('#aboutBody *')].find(e=>/^(sum of \d+ provinces|ผลรวม \d+ จังหวัด)$/.test((e.textContent||'').trim())&&e.children.length===0);
   if(el)set(el,(el.textContent||'').trim().replace(/\d+/,'76'));
  }
 };
 // The defect is re-applied SYNCHRONOUSLY, in the observer's own callback, which runs as a
 // microtask before the next frame. A defect that is restored on the next animation frame
 // leaves a window in which the real value is visible — and a gate that waits for a value
 // would see it there and resolve. The defect has to be un-observable, not merely re-applied.
 let busy=false;
 const observer=new MutationObserver(()=>{if(busy)return;busy=true;try{apply();}finally{busy=false;}});
 const wire=()=>{
  apply();
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);
 else wire();
 // The falsifier arms a defect on a surface that is ALREADY loaded, so the gate's own waits
 // have passed and the defect is the only thing that can fail.
 window.__armDefect=mode=>{sessionStorage.setItem('__falsifier',mode);apply();};
});

// The DATA defect. The site serves its corpus over HTTP, so a defect in the corpus is served
// the same way. It is armed once the page has taken its own copy, so the corpus the site
// serves afterwards is not the corpus the page is holding — which is the state a stale cached
// corpus produces, and the state in which a published number and the shipped data disagree.
let doctor=null;
const serve=async route=>{
 const res=await route.fetch();
 const body=await res.json();
 await route.fulfill({response:res,json:doctor.mutate(body)});
};
await page.route('**/data/bible.json',async route=>{
 if(!doctor||doctor.path!=='bible'){await route.fallback();return;}
 await serve(route);
});
await page.route('**/data/tgo/tver-forestry.json',async route=>{
 if(!doctor||doctor.path!=='tgo'){await route.fallback();return;}
 await serve(route);
});

const byName=name=>{
 const surface=SURFACES.find(s=>s.name===name);
 assert.ok(surface,`no such surface: ${name}`);
 return surface;
};

// Open a surface the way the live verification opens it.
//
// `mode` arms a defect BEFORE the page is opened, for the defects that have to be in place
// before the page's own script runs. The export defect is one of them: the page's module
// resolves the Blob constructor when it is evaluated, so a Blob replaced afterwards is not
// the Blob the module uses, and the export comes out untouched. The mode is written to
// session storage, which survives the navigation, and the init script installs the defect at
// document start.
async function open(surface,lang,width,{mode=null}={}){
 // Clear any defect left armed by the previous case, before the next navigation reads it.
 await page.evaluate(()=>{try{sessionStorage.removeItem('__falsifier');}catch{}}).catch(()=>{});
 if(mode)await page.evaluate(m=>sessionStorage.setItem('__falsifier',m),mode);
 await page.setViewportSize({width,height:width<=390?700:900});
 await openSurface(page,base,surface,lang);
}

// Break the surface that is already on the screen.
async function arm(mode){
 await page.evaluate(m=>window.__armDefect(m),mode);
}

// --- The baseline. Every case below is only meaningful if the surface is green to begin with.
for(const surface of SURFACES){
 await open(surface,'th',1440);
 await surface.prove(page,'th',1440);
 console.log(`  ok  baseline: ${surface.name} passes before it is broken`);
}

// The defects. Each one breaks a surface in the way the site itself would break it.
const CASES=[
 {
  surface:'the Thailand workbench', mode:'kpi-placeholder',
  defect:'the headline figure never arrives and stays a placeholder',
  expect:/not a magnitude/,
 },
 {
  surface:'the Thailand workbench', mode:'kpi-drift',
  defect:'the headline drifts away from the calculation that produced it',
  expect:/the headline says/,
 },
 {
  surface:'the Thailand workbench', mode:'trace-empty',
  defect:'the calculation trace loses its figure',
  expect:/carries no tCO₂e figure/,
 },
 {
  surface:'the Thailand workbench', mode:'area-nounit',
  defect:'the selected area loses its unit',
  expect:/carries no unit/,
 },
 {
  surface:'the Thailand workbench', mode:'map-collapse',
  defect:'the map collapses to a strip',
  expect:/map is not on the page/,
 },
 {
  surface:'the Thailand workbench', mode:'result-drift',
  defect:'the figure on the page drifts away from the file the reader takes away',
  expect:/the export says/,
 },
 {
  surface:'the About view', mode:'about-records',
  defect:'the About view states a registry count the snapshot does not hold',
  expect:/registry records/,
 },
 {
  surface:'the About view', mode:'about-provinces',
  defect:'the About view states a province count the ledger does not hold',
  expect:/provinces/,
 },
 {
  surface:'the Bible', mode:'bible-count',
  defect:'the chapter counter shows fewer chapters than the corpus holds',
  expect:/not seeing the whole corpus/,
 },
 {
  surface:'the Bible', mode:'bible-truncated',
  defect:'the chapter counter and the reader agree with each other but not with the corpus',
  expect:/it lists/,
 },
 {
  surface:'the Bible', mode:'bible-title',
  defect:'the chapter loses its title',
  expect:/has no title/,
 },
 {
  surface:'the Bible', mode:'bible-body',
  defect:'the chapter body empties',
  expect:/characters long/,
 },
 {
  surface:'the Bible', mode:'bible-sources',
  defect:'the chapter names no source',
  expect:/names no source/,
 },
 {
  surface:'the research notebook', mode:'research-toc',
  defect:'the index miscounts the chapters',
  expect:/index says/,
 },
 {
  surface:'the research notebook', mode:'research-skip',
  defect:'the skip link lands on the front matter instead of the first chapter',
  expect:/hash|Timeout/i,
 },
 {
  surface:'the guide', mode:'guide-title',
  defect:'a route loses its title',
  expect:/has no title/,
 },
 {
  surface:'the guide', mode:'guide-desc',
  defect:'a route loses its description',
  expect:/has no description/,
 },
 {
  surface:'the guide', mode:'guide-route',
  defect:'the guide loses a route',
  expect:/offers 2 routes/,
 },
 {
  surface:'the regional workspace', mode:'country-note',
  defect:'a country number loses its dated source',
  expect:/no dated source note/,
 },
 {
  surface:'the regional workspace', mode:'head-period',
  defect:'the comparison table loses a period',
  expect:/lost the period/,
 },
 {
  surface:'the regional workspace', mode:'view-name',
  defect:'the desktop button and the phone selector name the view differently',
  expect:/is named/,
 },
];

for(const c of CASES){
 const surface=byName(c.surface);
 doctor=null;
 await open(surface,'th',1440);
 await arm(c.mode);
 let caught=null;
 try{
  await surface.prove(page,'th',1440);
 }catch(err){
  caught=err;
 }
 assert.ok(caught,`${c.surface}: the gate passed a broken page — ${c.defect}`);
 assert.match(caught.message,c.expect,`${c.surface}: the gate caught the defect but for the wrong reason — ${c.defect}\n  said: ${caught.message}`);
 console.log(`  ok  ${c.surface}: ${c.defect} → ${caught.message.split('\n')[0]}`);
}

// The defects that have to be in place BEFORE the page's own script runs.
//
// The export is produced by the page's module, and that module resolves the Blob constructor
// when it is evaluated. A Blob replaced after the evaluation is not the Blob the module
// uses: the export comes out untouched and the gate passes a file that claims something the
// product is not entitled to claim. So this defect is armed through session storage before
// the navigation, and the init script installs it at document start.
const PRE_ARMED_CASES=[
 {
  surface:'the Thailand workbench', mode:'export-credits',
  defect:'the export claims issued credits for an illustrative example',
  expect:/claims issued credits/,
 },
];

for(const c of PRE_ARMED_CASES){
 const surface=byName(c.surface);
 // The page is opened at COMMIT: the document has started, but the page's own script has not
 // run yet. The defect is installed in that window, which is the only window in which the
 // export can be made to lie: the page's module resolves the Blob constructor when it is
 // evaluated, so a Blob replaced after the evaluation is not the Blob the module uses.
 await page.evaluate(()=>{try{sessionStorage.removeItem('__falsifier');}catch{}}).catch(()=>{});
 await page.setViewportSize({width:1440,height:900});
 await page.goto(`${base}${surface.path('th')}`,{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator(surface.ready).first().waitFor({timeout:60000});
 await page.evaluate(()=>{
  // The seam is URL.createObjectURL, not Blob and not JSON.stringify.
  //
  // The page's module resolves the Blob constructor when it is evaluated, so a Blob replaced
  // afterwards is not the Blob the module uses, and the export comes out untouched — the same
  // was true of JSON.stringify. But `URL.createObjectURL` is a plain property of the URL
  // constructor, and a property access on a global object is resolved when the call is made,
  // every time. So the file the reader takes away is replaced here, and the gate has to
  // notice.
  const real=URL.createObjectURL.bind(URL);
  URL.createObjectURL=function(blob){
   if(blob&&blob.type==='application/json'){
    return real(new Blob([JSON.stringify({issuedCredits:733914})],{type:'application/json'}));
   }
   return real(blob);
  };
 });
 if(surface.settle)await surface.settle(page,'th',1440);
 let caught=null;
 try{
  await surface.prove(page,'th',1440);
 }catch(err){
  caught=err;
 }
 assert.ok(caught,`${c.surface}: the gate passed a broken page — ${c.defect}`);
 assert.match(caught.message,c.expect,`${c.surface}: the gate caught the defect but for the wrong reason — ${c.defect}\n  said: ${caught.message}`);
 console.log(`  ok  ${c.surface}: ${c.defect} → ${caught.message.split('\n')[0]}`);
}

// The DATA defects. Here the page renders something true about a corpus the site no longer
// serves, so only the published number and the shipped data can disagree. These are the
// failures that no DOM defect can produce, and they are the ones a reader would see as a
// wrong figure rather than a broken page.
const DATA_CASES=[
 {
  surface:'the Bible',
  defect:'the site ships one chapter fewer than the reader is holding',
  path:'bible',
  mutate:body=>({...body,chapters:body.chapters.slice(0,-1)}),
  expect:/the corpus this site ships holds/,
 },
 {
  surface:'the guide',
  defect:'the guide states a corpus size the site no longer ships',
  path:'bible',
  mutate:body=>({...body,chapters:body.chapters.slice(0,-1)}),
  expect:/the corpus this site ships holds/,
 },
 {
  surface:'the About view',
  defect:'the registry snapshot the site ships no longer holds the count the About view states',
  path:'tgo',
  mutate:body=>({...body,national:{...body.national,projects:body.national.projects-1}}),
  expect:/the snapshot ships/,
 },
];

for(const c of DATA_CASES){
 const surface=byName(c.surface);
 // The corpus is served over HTTP, so the defect has to be armed before the page asks for
 // it. It is applied AFTER the page's own request, so the page holds a corpus the site no
 // longer serves — which is exactly the state a stale cached corpus produces.
 await open(surface,'th',1440);
 // The page has already taken its own copy of the data. The defect is armed now, so the next
 // request — the one the gate makes when it compares the published figure with what the site
 // ships — is answered with a corpus the page is not holding.
 doctor={path:c.path,mutate:c.mutate};
 let caught=null;
 try{
  await surface.prove(page,'th',1440);
 }catch(err){
  caught=err;
 }finally{
  doctor=null;
 }
 assert.ok(caught,`${c.surface}: the gate passed a page whose published number disagrees with the shipped data — ${c.defect}`);
 assert.match(caught.message,c.expect,`${c.surface}: the gate caught the data defect but for the wrong reason — ${c.defect}\n  said: ${caught.message}`);
 console.log(`  ok  ${c.surface}: ${c.defect} → ${caught.message.split('\n')[0]}`);
}

// The sideways-scroll check has its own defect: a page that is wider than the viewport.
{
 const surface=byName('the guide');
 await open(surface,'th',390);
 await page.evaluate(()=>{const d=document.createElement('div');d.style.cssText='width:2000px;height:10px';document.body.append(d);});
 let caught=null;
 try{
  await assertNoSidewaysScroll(page,'th',390,surface.name);
 }catch(err){
  caught=err;
 }
 assert.ok(caught,`the guide: the gate passed a page that scrolls sideways`);
 assert.match(caught.message,/scrolls sideways/,`the guide: the sideways check caught it for the wrong reason — ${caught.message}`);
 console.log(`  ok  the guide: a page that scrolls sideways → ${caught.message}`);
}

// The wait itself. A wait for an element the page ships with a placeholder in it resolves
// instantly and proves nothing; the gate must wait for the FIGURE. This arms the defect
// before the page loads, so the figure never arrives, and shows that the old wait passes
// while the new one does not.
{
 const surface=byName('the Thailand workbench');
 await page.evaluate(()=>sessionStorage.setItem('__falsifier','kpi-placeholder'));
 await page.setViewportSize({width:1440,height:900});
 // The page is opened WITHOUT settling: the defect prevents the content from arriving, so a
 // settle here would wait for a figure that is never coming — which is the thing being proved.
 await openSurface(page,base,surface,'th',{settle:false});
 const placeholder=await page.evaluate(()=>document.querySelector('#kStock').textContent);
 assert.ok(!/\d/.test(placeholder),`the workbench: the figure arrived anyway (${placeholder})`);
 // The old wait: the element exists, so it resolves at once — and proves nothing.
 await page.locator('#kStock').waitFor({timeout:5000});
 // The gate's wait: the figure never comes, so it must not resolve.
 let resolved=false;
 try{
  await surface.settle(page,'th',1440,{timeout:4000});
  resolved=true;
 }catch{}
 assert.ok(!resolved,`the workbench: the gate's wait resolved even though the figure never arrived`);
 console.log('  ok  the Thailand workbench: the wait resolves only when the figure arrives, not when the placeholder does');
 await page.evaluate(()=>sessionStorage.removeItem('__falsifier'));
}

await browser.close();
await target.stop();
console.log(`\nPASS live surface falsifier: ${CASES.length+PRE_ARMED_CASES.length+DATA_CASES.length+2} defects were caught by the live verification's own assertions.`);
