import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:8788';await mkdir('test-results',{recursive:true});const b=await chromium.launch();const errors=[],failed=[];
for(const lang of ['th','en'])for(const width of [1280,390]){
 const context=await b.newContext({viewport:{width,height:900}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
 const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:1500000,uploadThroughput:750000});
 await page.goto(`${base}/?lang=${lang}`,{waitUntil:'domcontentloaded'});await page.locator('#kStock').filter({hasText:'M'}).waitFor();assert.ok(await page.locator('#guideLink').isVisible());
 const popup=page.waitForEvent('popup');await page.locator('#guideLink').click();const guide=await popup;await guide.waitForLoadState();assert.equal(await guide.locator('html').getAttribute('lang'),lang);
 for(const id of ['province','area','project','layers','help','reference']){await guide.locator(`.manual-index a[href="#${id}"]`).click();assert.equal(await guide.locator(`#${id}`).count(),1);}
 assert.ok(await guide.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await guide.locator('.manual-index a[href="#province"]').click();await guide.screenshot({path:`test-results/manual-${lang}-${width}.png`});
 // First visit: follow province route, no supplied files.
 await page.locator('#exploreProvinces').click();await page.locator('.province-row').first().waitFor();assert.equal(await page.locator('.province-row').count(),77);await page.locator('#place').selectOption('TH50');assert.match(await page.locator('#selectionName').innerText(),lang==='th'?/เชียงใหม่/:/Chiang Mai/);
 // Returning user: find example and export using the guide's project route.
 await page.locator('.advanced-tools>summary').click();await page.locator('.lenses [data-tab=project]').click();await page.locator('#example').click();await page.locator('#boundaryInfo').waitFor({state:'visible'});await page.locator('.advanced-tools>summary').click();await page.locator('.lenses [data-tab=calculate]').click();await page.locator('[type=submit]').click();assert.match(await page.locator('#result').innerText(),/218\.86/);
 const dl=page.waitForEvent('download');await page.locator('#exportJSON').click();assert.ok((await dl).suggestedFilename().endsWith('.json'));
 // Edge case: guide stays separate and explains withheld resolution for small imported boundary.
 await page.locator('#aboutTab').click();await page.locator('#aboutBody h1').waitFor();assert.ok(await page.locator('#guideLink').isVisible());await page.locator('.about-links [data-tab=carbon]').first().click();await page.locator('#useBoundary').click();await page.waitForFunction(()=>document.querySelector('#kStock').textContent==='—');assert.equal(await page.locator('[data-calculation=stock] .calc-answer').innerText(),'— tCO₂e');
 await guide.locator('.manual-index a[href="#help"]').click();assert.ok(await guide.locator('#help table').isVisible());await page.screenshot({path:`test-results/manual-flow-${lang}-${width}.png`});
 await context.close();
}
assert.deepEqual(errors,[]);await writeFile('test-results/manual-walkthrough.json',JSON.stringify({base,checkedAt:new Date().toISOString(),errors,failed,scenarios:['new user: province','returning: example and export','edge: withheld small boundary'],note:'Simulated cognitive walkthrough; not a study with recruited users.'},null,2));await b.close();console.log('PASS manual-led journeys, TH/EN, desktop/mobile, slow Wi-Fi');
