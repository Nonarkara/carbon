import {clickControl,revealControl} from './browser-controls.mjs';
import {chromium} from 'playwright';import assert from 'node:assert/strict';
import {measurementTarget} from './lib/local-server.mjs';
import {gotoRetry} from './lib/browser-nav.mjs';
const base=(await measurementTarget()).base;const b=await chromium.launch();const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const width of [1440,1280,390])for(const lang of ['th','en']){
 await p.setViewportSize({width,height:width===1280?720:900});await gotoRetry(p, `${base}/?lang=${lang}`,{waitUntil:'domcontentloaded'});await p.locator('#kStock').filter({hasText:'M'}).waitFor();
 assert.equal(await p.locator('.brand-strip>img').count(),3);
 for(const img of await p.locator('.brand-strip img').all())assert.ok(await img.evaluate(e=>e.complete&&e.naturalWidth>0));
 assert.equal(await p.locator('.brand-strip').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
 assert.equal(await p.locator('#standardsLink').getAttribute('href'),`research-${lang}.html#standards`);
 if(width===1280){await clickControl(p,'.advanced-tools>summary');await clickControl(p,'.lenses [data-tab=project]');await p.locator('#example').click();assert.equal(await p.locator('.advanced-tools').getAttribute('open'),null);}
 await clickControl(p,'#aboutTab');await p.locator('.research-person').waitFor();await p.locator('.research-person>img').evaluate(e=>e.decode());
 const person=await p.locator('.research-person').boundingBox();assert.ok(person.y+person.height<900,'Profile visible immediately');
 assert.match(await p.locator('#standards').innerText(),/ISO 14064-2:2019[\s\S]*ISO 14064-3:2019[\s\S]*ISO 14065:2020/);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:`test-results/client-research-${width}-${lang}.png`});
}
assert.deepEqual(errors,[]);await b.close();console.log('PASS client identity/profile/standards checks '+base);
