import {selectSeaView} from './browser-controls.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {clickControl} from './browser-controls.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:8788';const browser=await chromium.launch();const page=await browser.newPage();const errors=[],measurements=[];page.on('pageerror',e=>errors.push(e.message));await mkdir('test-results/carbona',{recursive:true});
const logo=await page.request.get(`${base}/images/logos/axiom-navy-tile.png`);assert.ok(logo.ok());assert.equal(createHash('sha256').update(await logo.body()).digest('hex'),'e3a5787dd2b7e9d33e2dc55ff86faef6b2166df7ea15b6f9d15d54975290a51f','Axiom must be the exact owner-supplied PNG');
const manifest=await page.request.get(`${base}/manifest.json`).then(r=>r.json());assert.equal(manifest.short_name,'Carbona');assert.equal(manifest.id,'/');assert.equal(manifest.start_url,'/');
for(const lang of ['th','en'])for(const width of [320,390,768,1440]){
 const name=lang==='th'?'คาร์บอนนะ':'Carbona';await page.setViewportSize({width,height:900});await page.goto(`${base}/sea.html?lang=${lang}&country=BRN`,{waitUntil:'domcontentloaded'});await page.locator('body[data-ready]').first().waitFor();await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('#brandName').textContent(),name);assert.match(await page.title(),new RegExp(name));
 await selectSeaView(page,'research');const r=await page.locator('#readingRoutes').evaluate(e=>{const links=[...e.children];return {height:e.offsetHeight,count:links.length,font:parseFloat(getComputedStyle(links[0]).fontSize),rowGap:parseFloat(getComputedStyle(e).rowGap),targets:links.map(a=>a.getBoundingClientRect().height)};});measurements.push({lang,width,...r});assert.equal(r.count,9);assert.ok(r.height<=(width<=700?240:100),'auxiliary list consumes primary-content space');assert.ok(r.targets.every(h=>h>=24),'auxiliary targets too small');assert.ok(r.font<=13&&r.rowGap<=2,'auxiliary hierarchy lost');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#readingRoutes a').first().focus();assert.equal(await page.locator('#readingRoutes a').first().evaluate(e=>document.activeElement===e),true);
 if(width===390){await page.locator('.research-route').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/carbona/reading-${lang}.png`});}
 await page.locator(`[data-lang=${lang==='th'?'en':'th'}]`).click();assert.equal(await page.locator('#country').inputValue(),'BRN');assert.equal(await page.locator('#brandName').textContent(),lang==='th'?'Carbona':'คาร์บอนนะ');
}
for(const lang of ['th','en']){
 const name=lang==='th'?'คาร์บอนนะ':'Carbona';await page.setViewportSize({width:390,height:900});await page.goto(`${base}/?lang=${lang}`,{waitUntil:'domcontentloaded'});await page.locator('#kStock').filter({hasText:'M'}).waitFor();assert.equal(await page.locator('.brand [data-i18n=title]').textContent(),name);assert.match(await page.title(),new RegExp(name));await clickControl(page,'#aboutTab');await page.locator('.product-identity').first().waitFor();assert.equal(await page.locator('.product-identity b').first().textContent(),name);
 const mark=page.locator('img[src="images/logos/axiom-navy-tile.png"]').first();await mark.evaluate(e=>e.decode());assert.equal(await mark.evaluate(e=>getComputedStyle(e).filter),'none');const corner=await mark.evaluate(e=>{const c=document.createElement('canvas');c.width=e.naturalWidth;c.height=e.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(e,0,0);return ctx.getImageData(0,0,1,1).data[3];});assert.equal(corner,0,'PNG transparency was lost');
 for(const path of [`guide-${lang}.html`,`research-${lang}.html`]){await page.goto(`${base}/${path}`,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);await page.locator('.product-identity b').first().waitFor();assert.equal(await page.locator('.product-identity b').first().textContent(),name);assert.equal(await page.locator('.product-identity img').first().getAttribute('src'),'images/brand/ct-mark.png','obsolete raster wordmark is visible');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.goto(`${base}/bible.html?lang=${lang}#sea-what-is-a-credit`,{waitUntil:'domcontentloaded'});await page.locator('.prose').waitFor();assert.match(await page.title(),/Carbona/);assert.ok(await page.locator('.figure-stack svg').count()>0,'new credit teaching figures lost');
}
for(const lang of ['th','en'])for(const width of [390,1440])for(const chapter of ['sea-what-is-a-credit','sea-borders','sea-industry']){
 await page.setViewportSize({width,height:900});await page.goto(`${base}/bible.html?lang=${lang}#${chapter}`);await page.locator('.credit-figure').first().waitFor();await page.evaluate(()=>document.fonts.ready);
 const defects=await page.locator('.credit-figure svg').evaluateAll(svgs=>svgs.flatMap(svg=>[...svg.querySelectorAll('text')].flatMap(t=>{const b=t.getBBox(),v=svg.viewBox.baseVal,scale=svg.getBoundingClientRect().width/v.width;return b.x<0||b.x+b.width>v.width||b.y<0||b.y+b.height>v.height||parseFloat(getComputedStyle(t).fontSize)*scale<12?[t.textContent]:[]})));
 assert.deepEqual(defects,[],`${lang}/${width}/${chapter}: clipped or unreadable credit labels`);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'diagram expands page');
 assert.equal(await page.locator('.credit-diagram-scroll[tabindex="0"]').count(),await page.locator('.credit-figure').count());
 await page.locator('.diagram-transcript summary').first().click();assert.ok((await page.locator('.diagram-transcript ul').first().innerText()).length>100);
 if(chapter==='sea-what-is-a-credit')await page.screenshot({path:`test-results/carbona/credit-${lang}-${width}.png`});
}
assert.deepEqual(errors,[]);await writeFile('test-results/carbona/summary.json',JSON.stringify({base,checkedAt:new Date().toISOString(),measurements,checks:['localized name and titles','install identity retained','exact supplied Axiom bytes and transparency','no obsolete raster wordmark','auxiliary spacing and target sizes','country retained during language change','new credit figures retained'],pageErrors:errors},null,2));await browser.close();console.log('PASS Carbona: localized identity, exact Axiom mark, compact auxiliary reading and preserved country/credit flows.');
