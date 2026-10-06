import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:8788';
const browser=await chromium.launch();const page=await browser.newPage({acceptDownloads:true});const errors=[];
page.on('pageerror',e=>errors.push(e.message));await mkdir('test-results',{recursive:true});
for(const lang of ['th','en'])for(const width of [375,1440]){
 await page.setViewportSize({width,height:1000});
 await page.goto(`${base}/bible.html?lang=${lang}#sme-worked`);await page.locator('.prose').waitFor();
 assert.match(await page.locator('#count').textContent(),/44/);
 assert.ok((await page.locator('.prose').textContent()).includes('41.42'));
 assert.equal(await page.locator('.design-illustration svg').count(),1);
 const hash=new URL(page.url()).hash;await page.locator('[data-section]').first().click();assert.equal(new URL(page.url()).hash,hash);
 assert.ok(await page.locator('[data-section]').count()>=4);
 await page.locator('.design-illustration a[download]').scrollIntoViewIfNeeded();
 const diagramDownload=page.waitForEvent('download');await page.locator('.design-illustration a[download]').click();assert.equal((await diagramDownload).suggestedFilename(),`sme-worked-${lang}.svg`);
 await page.locator('#readingPaths a[href="#climate-impacts"]').click();await page.locator('.artifact-gallery').waitFor();
 const images=page.locator('.artifact-gallery img');assert.equal(await images.count(),3);
 for(const img of await images.all()){await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());assert.ok(await img.evaluate(e=>e.naturalWidth>0));assert.ok((await img.getAttribute('alt')).length>20);}
 assert.equal(await page.locator('.artifact-gallery a[download]').count(),4);
 const imageDownload=page.waitForEvent('download');await page.locator('.artifact-gallery a[download]').first().click();assert.equal((await imageDownload).suggestedFilename(),'grinnell.jpg');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getClientRects().length).filter(e=>getComputedStyle(e).boxShadow!=='none'||getComputedStyle(e).textShadow!=='none').map(e=>e.tagName)),[]);
 await page.locator('#article').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/bible-impacts-${lang}-${width}.png`,fullPage:false});
 await page.locator('[data-group="design"]').click();await page.locator('#search').fill(lang==='th'?'หน่วยหน้าที่':'functional unit');
 assert.ok(await page.locator('#results a[href="#product-design"]').count());
 await page.locator('#results a[href="#product-design"]').click();await page.locator('.prose').filter({hasText:lang==='th'?'ปันส่วน':'allocation'}).waitFor();
 await page.locator('#article').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/bible-design-${lang}-${width}.png`});
}
assert.deepEqual(errors,[]);await browser.close();console.log('Bible design: TH/EN phone/desktop, search, section navigation, SVG/image downloads, gallery and flat UI passed.');
