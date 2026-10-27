// Exercise real interactions with a controlled GeoJSON response, independent of Photon uptime.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {measurementTarget} from './lib/local-server.mjs';
const target=await measurementTarget(),browser=await chromium.launch(),errors=[];
try{
 for(const lang of ['th','en'])for(const touch of [false,true])for(const width of [320,390]){
  const context=await browser.newContext({viewport:{width,height:844},hasTouch:touch});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://photon.komoot.io/api/**',async route=>{
   const params=new URL(route.request().url()).searchParams;assert.ok(['default','en'].includes(params.get('lang')),'Photon does not accept Thai as a response language');const q=params.get('q');
   if(q==='Older')await new Promise(r=>setTimeout(r,700));
   await route.fulfill({json:{features:[{type:'Feature',geometry:{type:'Point',coordinates:[100.5,13.75]},properties:{name:q,country:'Thailand'}}]}});
  });
  await page.goto(target.base+'/?lang='+lang,{waitUntil:'domcontentloaded'});
  await page.locator('#kStock').filter({hasText:'M'}).waitFor();await page.evaluate(()=>document.fonts.ready);
  assert.ok(await page.locator('#workspaceBar').evaluate(e=>e.getBoundingClientRect().height)<= (touch?46:38),'national header exceeds its content budget');
  const fit=await page.locator('#place').evaluate(el=>{const c=document.createElement('canvas').getContext('2d');c.font=getComputedStyle(el).font;return{have:el.clientWidth,need:c.measureText(el.selectedOptions[0].text).width+22};});
  assert.ok(fit.have>=fit.need,'place search clips the geography selector');
  const noOverlap=await page.evaluate(()=>{const a=document.querySelector('#measureBtn').getBoundingClientRect(),b=document.querySelector('#overlayLegend').getBoundingClientRect();return a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom;});
  assert.ok(noOverlap,'measure button covers the carbon legend');
  const paint=await page.locator('#measureBtn').evaluate(e=>({bg:getComputedStyle(e).backgroundColor,height:e.getBoundingClientRect().height,target:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--control-block'))}));
  assert.equal(paint.bg,'rgb(255, 255, 255)','measurement disappears into dark map tiles');assert.ok(paint.height<=paint.target+1,'measurement has excessive vertical padding');
  await page.locator('.geocode-wrap>summary').click();
  assert.ok(await page.locator('.geocode-panel').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}),'search popup bleeds beyond the viewport');
  assert.equal(await page.locator('.geocode-panel').evaluate(e=>getComputedStyle(e).position),'absolute','search is detached from its field');
  await page.locator('.reference-menu>summary').click();assert.equal(await page.locator('.geocode-wrap').getAttribute('open'),null,'two workspace popovers remain open');
  await page.locator('.geocode-wrap>summary').click();assert.equal(await page.locator('.reference-menu').getAttribute('open'),null);
  const input=page.locator('#geocodeSearch');await input.fill('Bangkok');
  await page.getByRole('option',{name:'Bangkok · Thailand',exact:true}).waitFor();await input.press('Tab');await page.waitForTimeout(200);assert.equal(await page.locator('.geocode-item').evaluate(e=>e===document.activeElement),true,'search result loses keyboard focus');await page.keyboard.press('Enter');
  await page.locator('.leaflet-popup-content').filter({hasText:'Bangkok'}).waitFor();
  await input.fill('Older');await page.waitForRequest(r=>r.url().includes('q=Older'));
  await input.fill('Newer');await page.getByRole('option',{name:'Newer · Thailand',exact:true}).waitFor();
  await page.waitForTimeout(850);assert.equal(await page.locator('.geocode-item').innerText(),'Newer · Thailand','stale search replaces current results');
  await input.press('Escape');assert.equal(await page.locator('.geocode-wrap').getAttribute('open'),null);
  await page.locator('#measureBtn').click();assert.equal(await page.locator('#measureBtn').getAttribute('aria-pressed'),'true');
  const mapBox=await page.locator('#map').boundingBox();await page.mouse.move(mapBox.x+100,mapBox.y+130);await page.mouse.down();await page.mouse.move(mapBox.x+120,mapBox.y+150,{steps:5});await page.mouse.up();
  await page.locator('#map').click({position:{x:60,y:330}});await page.locator('#map').click({position:{x:140,y:390}});
  await page.waitForFunction(()=>document.querySelector('#measureReadout').textContent!=='—');
  await page.locator('#measureClear').click();assert.equal(await page.locator('#measureReadout').innerText(),'—');
  await page.locator('#measureDone').click();assert.equal(await page.locator('#measureBtn').getAttribute('aria-pressed'),'false');
  await page.locator('#map').click({position:{x:110,y:140}});assert.equal(await page.locator('#measureReadout').innerText(),'—','inactive measurement captures map selection');
  const next=lang==='th'?'en':'th';await page.locator(`[data-lang=${next}]`).click();
  assert.equal(await page.locator('#measureDone').textContent(),next==='en'?'Done':'เสร็จ');
  assert.equal(await page.locator('.geocode-wrap>summary').getAttribute('aria-label'),next==='en'?'Search place':'ค้นหาสถานที่');
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS map tools: pointer/touch TH/EN; readable geography, legend separation, GeoJSON search selection, stale response protection, Escape, measure/clear/done/inactive.');
}finally{await browser.close();await target.stop();}
