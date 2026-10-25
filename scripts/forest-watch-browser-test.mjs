import {clickControl,revealControl} from './browser-controls.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {measurementTarget} from './lib/local-server.mjs';
import {gotoRetry} from './lib/browser-nav.mjs';
const base=(await measurementTarget()).base;
const browser=await chromium.launch();const page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('test-results',{recursive:true});
for(const lang of ['th','en'])for(const width of [375,1440]){
 await page.setViewportSize({width,height:900});
 await gotoRetry(page, `${base}/?lang=${lang}`,{waitUntil:'domcontentloaded'});
 await clickControl(page,'#openForestWatch');
 await page.locator('.forest-watch').waitFor({state:'visible'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow');
 assert.equal(await page.locator('.watch-confidence div').count(),3);
 assert.equal(await page.locator('[data-watch-province]').count(),5);
 // The watch version arrives with the feed; the panel can be on screen before it is written.
 await page.waitForFunction(()=>/v20261005/.test(document.querySelector('.forest-watch')?.textContent||''),null,{timeout:30000});
 assert.match(await page.locator('.forest-watch').innerText(),/v20261005/);
 await page.locator('.forest-watch summary').click();assert.equal(await page.locator('.forest-watch tbody tr').count(),30);
 await page.screenshot({path:`test-results/forest-watch-${lang}-${width}.png`});
 const pcode=await page.locator('[data-watch-province]').first().getAttribute('data-watch-province');
 await page.locator('[data-watch-province]').first().click();
 await page.locator('.forest-watch').waitFor({state:'visible'});
 assert.equal(await page.locator('#place').inputValue(),pcode);
 assert.equal(await page.locator('[data-watch-province]').count(),0);
 const downloadPromise=page.waitForEvent('download');await page.locator('#ledgerJSON').click();
 const download=await downloadPromise;const exported=JSON.parse(await readFile(await download.path(),'utf8'));
 assert.equal(exported.forestWatch.version,'v20261005');assert.equal(exported.forestWatch.unit,'ha');
 assert.equal(exported.selection.pcode,pcode);assert.ok(exported.rows.every(r=>r.id!=='forest_watch'));
 await gotoRetry(page, `${base}/bible.html?lang=${lang}#forest-watch`,{waitUntil:'domcontentloaded'});
 await page.locator('.illustration svg').waitFor();
 // The version line and the receipt are written when the Bible's data lands; the illustration
 // above them is static HTML and says nothing about their arrival.
 await page.waitForFunction(()=>/v20261005/.test(document.body.textContent||''),null,{timeout:30000});
 assert.match(await page.locator('body').innerText(),/v20261005/);
 assert.match(await page.locator('#receipt').innerText(),/2026-10-05/);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Bible overflow');
 await page.screenshot({path:`test-results/forest-watch-bible-${lang}-${width}.png`});
}
// Both a failed feed and malformed payload leave the core ledger operational.
for(const response of [{status:503,body:'Unavailable'},{status:200,contentType:'application/json',body:'{}'}]){
 await page.unroute('**/data/gfw/watch.json');
 await page.route('**/data/gfw/watch.json',r=>r.fulfill(response));
 await gotoRetry(page, `${base}/?lang=en`,{waitUntil:'domcontentloaded'});
 await clickControl(page,'#openForestWatch');await page.locator('.watch-status').waitFor({state:'visible'});
 await page.waitForFunction(()=>/M/.test(document.querySelector('#kStock')?.textContent||''),null,{timeout:30000});
 assert.match(await page.locator('.watch-status').innerText(),/unavailable/);assert.match(await page.locator('#kStock').innerText(),/M/);
}
assert.deepEqual(errors,[]);await browser.close();console.log('Forest Watch: TH/EN, phone/desktop, province selection, JSON provenance, Bible diagram and failed-feed checks passed.');
