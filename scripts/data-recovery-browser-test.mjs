import {clickControl} from './browser-controls.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {measurementTarget} from './lib/local-server.mjs';
import {gotoRetry} from './lib/browser-nav.mjs';
const target=await measurementTarget(),browser=await chromium.launch({headless:true});
const grid=await readFile('public/data/ledger/grid.bin');
async function draw(page){
 await page.locator('#pickArea').click();const b=await page.locator('#map').boundingBox();
 await page.mouse.move(b.x+b.width*.35,b.y+b.height*.3);await page.mouse.down();
 await page.mouse.move(b.x+b.width*.6,b.y+b.height*.6,{steps:8});await page.mouse.up();
 await page.waitForFunction(()=>document.querySelector('#place').value==='box');
}
try{
 {
  const page=await browser.newPage({viewport:{width:390,height:844}});let coreAttempts=0;
  await page.route('**/data/ledger/manifest.json',r=>++coreAttempts===1?r.fulfill({status:503,body:'source outage'}):r.continue());
  await gotoRetry(page,target.base+'/?lang=en');
  await page.locator('[data-retry-core]').waitFor({state:'visible'});
  assert.equal(await page.locator('#kStock').textContent(),'—');
  await clickControl(page,'.advanced-tools>summary');await clickControl(page,'.lenses [data-tab=project]');
  const boundary={type:'Feature',properties:{name:'recovery'},geometry:{type:'Polygon',coordinates:[[[100,14],[100.01,14],[100.01,14.01],[100,14.01],[100,14]]]}};
  await page.locator('#boundaryFile').setInputFiles({name:'recovery.geojson',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(boundary))});await page.locator('#boundaryInfo').filter({hasText:'recovery.geojson'}).waitFor();
  await clickControl(page,'.advanced-tools>summary');await clickControl(page,'.lenses [data-tab=carbon]');await page.locator('#useBoundary').click();
  assert.equal(await page.locator('[data-retry-core]').count(),1,'premature boundary selection preserves core recovery');assert.equal(await page.locator('[data-retry-grid]').count(),0,'must not substitute a grid retry before core sources exist');
  await page.locator('[data-retry-core]').click();
  await page.waitForFunction(()=>document.querySelector('#kStock').textContent.includes('M'));
  assert.equal(coreAttempts,2);assert.equal(await page.locator('#place option[value=TH50]').count(),1);
  await page.close();
 }
 for(const lang of ['en','th']){
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],requests={};let held,attempts=0;
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{const path=new URL(r.url()).pathname;requests[path]=(requests[path]||0)+1;});
  await page.route('**/data/cci/stock-years.json',r=>r.fulfill({status:200,contentType:'application/json',body:'{"meta":{"units":"wrong-family"}}'}));
  await page.route('**/data/ledger/nfi-check.json',r=>r.fulfill({status:404,body:'not found'}));
  await page.route('**/data/ledger/grid.bin',r=>++attempts===1?new Promise(resolve=>{held=async()=>{await r.fulfill({status:503,body:'temporary outage'});resolve();};}):r.fulfill({status:200,body:grid}));
  await gotoRetry(page,target.base+'/?lang='+lang);
  await page.waitForFunction(()=>/M/.test(document.querySelector('#kStock').textContent));
  await page.waitForFunction(()=>document.querySelector('[data-retry-source="stockYears"]')&&document.querySelector('[data-retry-source="nfi"]'));
  assert.equal(await page.locator('[data-calculation=stock-years]').count(),0,'bad schema never reaches a figure');
  await draw(page);assert.ok(held);await held();
  await page.locator('[data-retry-grid]').waitFor({state:'attached'});
  assert.equal(await page.locator('#kStock').textContent(),'—','failed grid is unavailable, never zero');
  await page.locator('#calculationTrace').evaluate(e=>{e.closest('details')?.setAttribute('open','');});
  // This is the actual recovery action; it does not reload the document or discard inputs.
  await page.locator('[data-retry-grid]').click();
  await page.waitForFunction(()=>/\d/.test(document.querySelector('#kStock').textContent));
  assert.equal(attempts,2);assert.equal(await page.locator('#place').inputValue(),'box');
  assert.equal(requests['/data/tgo/tver-forestry.json'],1,'two registry views share one source transfer');
  assert.equal(requests['/data/ledger/provinces.geojson'],1,'registry and landscape share province parsing');
  assert.deepEqual(errors,[]);await page.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:900}});let release;
 await page.route('**/data/ledger/grid.bin',route=>new Promise(resolve=>{release=async()=>{await route.fulfill({status:200,body:grid});resolve();};}));
 await gotoRetry(page,target.base+'/?lang=en');await page.waitForFunction(()=>/M/.test(document.querySelector('#kStock').textContent));
 await draw(page);await page.locator('#place').selectOption('TH50');
 await page.waitForFunction(()=>document.querySelector('#carbonVerdict').textContent.startsWith('Chiang Mai'));
 const response=page.waitForResponse('**/data/ledger/grid.bin');await release();await (await response).finished();
 await page.waitForFunction(()=>document.querySelector('#kStock').textContent.includes('M'));
 assert.equal(await page.locator('#place').inputValue(),'TH50');assert.match(await page.locator('#carbonVerdict').textContent(),/^Chiang Mai/);
 console.log('PASS data recovery: critical source fail/retry, TH/EN grid fail/retry, optional outage/schema, shared transport, stale-selection protection');
}finally{await browser.close();await target.stop();}
