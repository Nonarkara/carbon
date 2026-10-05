import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:8788';
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
  await page.goto(new URL(path,base).href,{waitUntil:'domcontentloaded'});
  const control=path.startsWith('/')?page.locator('#openForestWatch'):path.startsWith('bible')?page.locator('#clear'):page.locator('nav a').first();
  if(path.startsWith('/'))await page.locator('#kStock').filter({hasText:'M'}).waitFor();
  else if(path.startsWith('bible'))await page.locator('.illustration').waitFor();
  await audit();await control.hover();await audit();
  await control.focus();
  assert.notEqual(await control.evaluate(e=>getComputedStyle(e).outlineStyle),'none','keyboard focus disappeared');
  if(path.startsWith('/')||path.startsWith('bible')){
   const box=await control.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
   assert.equal(await control.evaluate(e=>getComputedStyle(e).transform),'none','pressed control moves or shrinks');
   await audit();await page.mouse.move(0,0);await page.mouse.up();
  }
  await page.screenshot({path:`test-results/flat-${lang}-${width}-${path.startsWith('/')?'dashboard':path.split('.')[0]}.png`});
 }
}
assert.deepEqual(errors,[]);await browser.close();console.log('Flat UI: dashboard/Bible/manual/research, TH/EN, phone/desktop, pseudo-elements, hover, active and keyboard focus passed.');
