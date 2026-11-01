import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import {clickControl} from './browser-controls.mjs';
import {measurementTarget} from './lib/local-server.mjs';
import {gotoRetry} from './lib/browser-nav.mjs';
const base=(await measurementTarget()).base;const b=await chromium.launch();const p=await b.newPage();const errors=[],measurements=[];p.on('pageerror',e=>errors.push(e.message));await mkdir('test-results',{recursive:true});
for(const lang of ['th','en'])for(const [width,height] of [[320,568],[375,667],[700,900],[701,900],[768,1024],[1440,900]]){
 await p.setViewportSize({width,height});await gotoRetry(p, `${base}/?lang=${lang}`,{waitUntil:'domcontentloaded'});await p.locator('#kStock').filter({hasText:'M'}).waitFor();
 const metrics=await p.evaluate(()=>{const m=document.querySelector('#map').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,mapWidth:m.width,mapHeight:m.height,header:document.querySelector('.top').offsetHeight,footerVisible:document.querySelector('.foot').checkVisibility(),round:getComputedStyle(document.querySelector('.leaflet-bar')).borderRadius};});measurements.push({lang,width,height,...metrics});assert.equal(metrics.overflow,false);assert.ok(metrics.mapHeight>=300);assert.ok(metrics.mapWidth>=(width<=1100?width-1:320));assert.equal(metrics.footerVisible,false);assert.equal(metrics.round,'0px');assert.match(await p.locator('#kStockHint').innerText(),/2020/);
 if(width<=1100){assert.ok(await p.locator('.bottom-nav').isVisible());assert.equal(await p.locator('.advanced-tools').isVisible(),false);await clickControl(p,'.bottom-nav [data-tab=project]');assert.equal(await p.locator('.bottom-nav button[aria-pressed=true]').count(),1);await p.locator('.bottom-nav [data-view=map]').click();assert.equal(await p.locator('.bottom-nav button[aria-pressed=true]').count(),1);await clickControl(p,'#worldMobile');assert.ok(await p.locator('#worldRail').isVisible());assert.equal(await p.locator('.bottom-nav button[aria-pressed=true]').count(),1);await p.locator('.bottom-nav [data-view=map]').click();}
 await clickControl(p,'#moreLayers');assert.ok(await p.locator('.layer-panel').isVisible());await p.locator('input[name=overlay][value=stock]').check();await p.locator('#pickArea').click();const overlap=await p.evaluate(()=>{const a=document.querySelector('#drawPrompt').getBoundingClientRect(),c=document.querySelector('#overlayLegend').getBoundingClientRect();return Math.max(0,Math.min(a.right,c.right)-Math.max(a.left,c.left))*Math.max(0,Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top));});assert.equal(overlap,0);
 await clickControl(p,'#aboutTab');await p.locator('.research-person').waitFor();assert.equal(await p.locator('.bottom-nav button[aria-pressed=true]').count(),0);assert.ok(await p.locator('.brand-strip img').first().isVisible());
 if(width===320){await gotoRetry(p, `${base}/?lang=${lang}`);await p.locator('#kStock').filter({hasText:'M'}).waitFor();await p.screenshot({path:`test-results/ship-phone-${lang}.png`,fullPage:true});}
}
// A repeatable CSS text-enlargement stress test; not OS zoom or WCAG certification.
await p.setViewportSize({width:375,height:667});await gotoRetry(p, `${base}/?lang=en`);await p.locator('#kStock').filter({hasText:'M'}).waitFor();await p.addStyleTag({content:'html{font-size:28px!important}'});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok((await p.locator('#map').boundingBox()).height>=300);await clickControl(p,'.bottom-nav [data-tab=project]');assert.ok(await p.locator('#example').isVisible());assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'enlarged project overflow');assert.ok(await p.locator('.bottom-nav').evaluate(nav=>{const boxes=[...nav.children].map(e=>e.getBoundingClientRect());return boxes.every((a,i)=>boxes.every((c,j)=>i===j||Math.min(a.right,c.right)-Math.max(a.left,c.left)<1||Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top)<1));}));await p.screenshot({path:'test-results/ship-text-enlarged.png',fullPage:true});
for(const lang of ['th','en'])for(const width of [320,768,1440]){
 await p.setViewportSize({width,height:850});await gotoRetry(p, `${base}/bible.html?lang=${lang}#uncertainty-worked`);await p.locator('.prose').waitFor();const y=await p.locator('#article').evaluate(e=>e.getBoundingClientRect().top);assert.ok(y>=0&&y<250,`deep link ${width}: ${y}`);assert.equal(await p.locator('#article').evaluate(e=>document.activeElement===e),true);assert.match(await p.locator('.prose').innerText(),/55.90/);
 await p.locator('#indexJump').click();assert.equal(await p.locator('#search').evaluate(e=>document.activeElement===e),true);await p.locator('#search').fill(lang==='th'?'ชุดหลักฐาน':'evidence pack');assert.ok(await p.locator('#results a[href="#evidence-dossier"]').isVisible());await p.locator('#results a[href="#evidence-dossier"]').click();await p.locator('.prose table').waitFor();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.locator(`[data-lang=${lang==='th'?'en':'th'}]`).click();assert.match(await p.locator('#article h1').innerText(),lang==='th'?/evidence pack/:/ชุดหลักฐาน/);
 if(width===320)await p.screenshot({path:`test-results/ship-reader-${lang}.png`,fullPage:true});
}
// The phone, on a touch screen. A thumb is not a mouse: the controls the design system
// sizes for a coarse pointer are measured here, the way the regional workspace's own proof
// measures its touch targets. The header is ONE band, the map's tools live in a panel that
// drops from it, and the map keeps the first screen.
const touchContext=await b.newContext({hasTouch:true,viewport:{width:390,height:844}});
const touch=await touchContext.newPage();
const phone=[];
for(const lang of ['th','en']){
 await touch.goto(`${base}/?lang=${lang}`,{waitUntil:'domcontentloaded'});await touch.locator('#kStock').filter({hasText:'M'}).waitFor({timeout:60000});
 const audit=await touch.evaluate(()=>{
  const map=document.querySelector('#map').getBoundingClientRect(),header=document.querySelector('header.top').getBoundingClientRect(),nav=document.querySelector('nav.bottom-nav').getBoundingClientRect();
  const vw=innerWidth,vh=innerHeight,top=Math.max(map.top,0),bottom=Math.min(map.bottom,vh),left=Math.max(map.left,0),right=Math.min(map.right,vw);
  const box=e=>{const r=e.getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height)};};
  return {header:Math.round(header.height),nav:Math.round(nav.height),share:Math.max(0,right-left)*Math.max(0,bottom-top)/(vw*vh),
   onMap:!!(document.elementFromPoint(vw/2,vh/2)?.closest('#map')),
   overflow:document.documentElement.scrollWidth>vw,
   toolsOpen:document.querySelector('#mapChromePanel').checkVisibility(),
   toggle:box(document.querySelector('#mapChromeToggle')),place:box(document.querySelector('#place')),
   read:box(document.querySelector('.reference-menu>summary')),
   langs:[...document.querySelectorAll('.langs button')].map(box),
   zoom:[...document.querySelectorAll('.leaflet-control-zoom a')].map(box)};
 });
 phone.push({lang,...audit});
 assert.ok(audit.header<=56,`${lang} phone header ${audit.header}px — the map's tools must not be a second band`);
 assert.ok(audit.nav<=57,`${lang} phone nav ${audit.nav}px`);
 assert.ok(audit.share>=0.6,`${lang} phone map share ${(audit.share*100).toFixed(1)}%`);
 assert.equal(audit.onMap,true,`${lang} phone: the centre of the first screen is not the map`);
 assert.equal(audit.overflow,false,`${lang} phone scrolls sideways`);
 assert.equal(audit.toolsOpen,false,`${lang} phone: the map's tools panel starts open`);
 // Every control a thumb must hit is at least the 36px the design system sets for a coarse
 // pointer. A control that is bigger than that is an inflated control, and the law has a
 // class for it, so this asserts a floor rather than a size.
 for(const [name,box] of [['tools',audit.toggle],['place',audit.place],['read',audit.read],...audit.langs.map((box,i)=>[`lang${i}`,box]),...audit.zoom.map((box,i)=>[`zoom${i}`,box])])assert.ok(box.h>=36,`${lang} phone ${name} target is ${box.w}×${box.h}`);
 // The panel opens, it holds the map's tools, and Escape puts it away again.
 await touch.locator('#mapChromeToggle').click();
 assert.ok(await touch.locator('#exploreProvinces').isVisible(),`${lang} phone: the tools panel did not open`);
 assert.equal(await touch.locator('#mapChromeToggle').getAttribute('aria-expanded'),'true');
 await touch.keyboard.press('Escape');
 assert.equal(await touch.locator('#mapChromeToggle').getAttribute('aria-expanded'),'false',`${lang} phone: Escape did not close the tools panel`);
}
await touchContext.close();
assert.deepEqual(errors,[]);await writeFile('test-results/ship-summary.json',JSON.stringify({base,checkedAt:new Date().toISOString(),measurements,checks:['F01–F12 regression cases','minimum map area and 700/701 transition','single active navigation','source year','toast/legend separation','partner information retained','square zoom container','text enlargement stress','reader-first deep links','search return and language state','390×844 phone on a touch screen: one header band, a map that keeps the first screen, and 36px targets'],phone,limits:['No independent novice usability session','No field-accuracy or certification claim'],pageErrors:errors},null,2));await b.close();console.log('PASS ship readiness: constrained screens, text stress, F05–F07 preservation and bilingual reader navigation.');
