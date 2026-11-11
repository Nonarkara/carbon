import {clickControl,revealControl} from './browser-controls.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {measurementTarget} from './lib/local-server.mjs';
import {gotoRetry} from './lib/browser-nav.mjs';
const base=(await measurementTarget()).base;
const browser=await chromium.launch();const page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('test-results',{recursive:true});
async function audit(){
 const violations=await page.evaluate(()=>{
  const bad=[];
  for(const e of document.querySelectorAll('body *')){
   if(!e.getClientRects().length)continue;
   for(const pseudo of [null,'::before','::after']){
    const s=getComputedStyle(e,pseudo);
    if(s.boxShadow!=='none'||s.textShadow!=='none'||s.filter.includes('drop-shadow'))bad.push({element:e.id||e.tagName,pseudo,shadow:s.boxShadow,text:s.textShadow,filter:s.filter});
   }
  }
  return bad;
 });
 assert.deepEqual(violations,[],'Visible surface or pseudo-element adds a shadow');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
}
for(const lang of ['th','en'])for(const width of [375,1440]){
 await page.setViewportSize({width,height:900});
 for(const path of [`/?lang=${lang}`,`bible.html?lang=${lang}#forest-watch`,`guide-${lang}.html`,`research-${lang}.html`]){
  await gotoRetry(page, new URL(path,base).href,{waitUntil:'domcontentloaded'});
  if(path.startsWith('/'))await revealControl(page,'#openForestWatch');const control=path.startsWith('/')?page.locator('#openForestWatch'):path.startsWith('bible')?page.locator('#clear'):page.locator('nav a').first();
  if(path.startsWith('/'))await page.locator('#kStock').filter({hasText:'M'}).waitFor();
  else if(path.startsWith('bible'))await page.locator('.illustration').waitFor();
  await audit();await control.hover();await audit();
  await page.keyboard.press('Tab');await control.focus();
  assert.notEqual(await control.evaluate(e=>getComputedStyle(e).outlineStyle),'none','keyboard focus disappeared');
  if(path.startsWith('/')||path.startsWith('bible')){
   const box=await control.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
   assert.equal(await control.evaluate(e=>getComputedStyle(e).transform),'none','pressed control moves or shrinks');
   await audit();await page.mouse.move(0,0);await page.mouse.up();
  }
  await page.screenshot({path:`test-results/flat-${lang}-${width}-${path.startsWith('/')?'dashboard':path.split('.')[0]}.png`});
 }
}
// A date field is several segments (day, month, year). Tab moves between them inside one input, and
// from the second segment on :focus-visible stops matching, so the house ring vanished while a keyboard
// reader typed the month and year. Walk every segment by Tab, as that reader does.
for(const lang of ['th','en']){
 await page.setViewportSize({width:1440,height:900});
 await gotoRetry(page,new URL(`/?lang=${lang}`,base).href,{waitUntil:'domcontentloaded'});
 await page.locator('#kStock').filter({hasText:'M'}).waitFor();
 await page.evaluate(()=>{document.querySelector('.lenses [data-tab=calculate]').click();const t=document.querySelector('#panelTitle');t.tabIndex=-1;t.focus();});
 const tabTo=async id=>{for(let i=0;i<40;i++){await page.keyboard.press('Tab');if(await page.evaluate(x=>document.activeElement?.id===x,id))return true;}return false;};
 // Each pair of fields shares one top edge, even when one label wraps and its neighbour does not.
 for(const [a,b] of await page.evaluate(()=>[...document.querySelectorAll('[data-panel=calculate] .pair')].map(p=>[...p.querySelectorAll('input,select')].slice(0,2).map(e=>Math.round(e.getBoundingClientRect().top)))))
  assert.ok(Math.abs(a-b)<=1,`${lang}: paired fields sit at different heights (${a} vs ${b})`);
 for(const id of ['start','end']){
  assert.ok(await tabTo(id),`${lang}: Tab never reached the ${id} date`);
  for(let segment=1;await page.evaluate(x=>document.activeElement?.id===x,id);segment++){
   assert.notEqual(await page.locator(`#${id}`).evaluate(e=>getComputedStyle(e).outlineStyle),'none',`${lang}: the ${id} date shows no focus ring on segment ${segment}`);
   assert.ok(segment<6,`${lang}: Tab is stuck in the ${id} date`);
   await page.keyboard.press('Tab');
  }
 }
}
// On a touch screen :hover sticks to the last thing tapped. A tapped province row must not stay lit.
{
 const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const t=await touch.newPage();
 await gotoRetry(t,new URL('/?lang=en',base).href,{waitUntil:'domcontentloaded'});
 await t.locator('#kStock').filter({hasText:'M'}).waitFor();
 assert.equal(await t.evaluate(()=>matchMedia('(hover:hover)').matches),false,'the touch context must report no hover');
 await t.evaluate(()=>document.querySelector('#exploreProvinces').click());
 const row=t.locator('.province-row').nth(2);await row.waitFor();await row.hover();
 const lit=await row.evaluate(e=>[e.matches(':hover'),getComputedStyle(e).backgroundColor]);
 const signal=await t.evaluate(()=>{const p=document.createElement('i');p.style.background='var(--signal)';document.querySelector('.dashboard').append(p);const c=getComputedStyle(p).backgroundColor;p.remove();return c;});
 assert.ok(lit[0],'the probe must actually hover the row');
 assert.notEqual(lit[1],signal,'a hovered province row is lit on a touch screen, where the highlight sticks after a tap');
 await touch.close();
}
assert.deepEqual(errors,[]);await browser.close();console.log('Flat UI: dashboard/Bible/manual/research, TH/EN, phone/desktop, pseudo-elements, hover, active and keyboard focus passed.');
