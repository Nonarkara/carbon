import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:8788';
await mkdir('test-results',{recursive:true});
const b=await chromium.launch();
const p=await b.newPage();
const errors=[];p.on('pageerror',e=>errors.push(e.message));
function luminance(rgb){const a=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return a[0]*.2126+a[1]*.7152+a[2]*.0722}
for(const lang of ['th','en']) for(const width of [375,768,1440]){
 await p.setViewportSize({width,height:width===375?812:1000});
 await p.goto(`${base}/?lang=${lang}`);
 await p.locator('#kStock').filter({hasText:'M'}).waitFor();
 await p.evaluate(()=>document.fonts.ready);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflows');
 for(const selector of ['#exploreProvinces','#pickArea','#aboutTab','.world-value','.calc-answer','.calc-block code','.calc-block p']){
  const pair=await p.locator(selector).first().evaluate(e=>{const fg=getComputedStyle(e).color;let n=e,bg;while(n){bg=getComputedStyle(n).backgroundColor;if(bg!=='rgba(0, 0, 0, 0)')break;n=n.parentElement;}return [fg,bg]});
  const [a,c]=pair.map(luminance),ratio=(Math.max(a,c)+.05)/(Math.min(a,c)+.05);
  assert.ok(ratio>=4.5,`${selector} contrast ${ratio.toFixed(2)}`);
 }
 assert.ok((await p.locator('#map').boundingBox()).height>280,'map lost its working area');
 if(width===375){
  const nav=await p.locator('#worldMobile').boundingBox();assert.ok(nav.x>=0&&nav.x+nav.width<=width,'World navigation clipped');
  await p.locator('#worldMobile').click();await p.locator('#worldFeeds').waitFor({state:'visible'});
  await p.locator('.bottom-nav [data-view=map]').click();
 }
 await p.screenshot({path:`test-results/design-${lang}-${width}.png`});
 await p.locator('#exploreProvinces').click();await p.locator('.province-row').first().waitFor();
 assert.equal(await p.locator('.province-row').count(),77);
 await p.locator('.province-row').first().click();
 await p.locator('#aboutTab').click();await p.locator('.research-person').waitFor();
 await p.screenshot({path:`test-results/design-research-${lang}-${width}.png`});
 await p.goto(`${base}/guide-${lang}.html`);await p.locator('.manual-routes').waitFor();
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'manual overflow');
 await p.screenshot({path:`test-results/design-manual-${lang}-${width}.png`});
}
await p.setViewportSize({width:1280,height:900});
await p.goto(`${base}/?lang=en`);await p.locator('#kStock').filter({hasText:'M'}).waitFor();
const cdp=await p.context().newCDPSession(p);
for(const mode of ['deuteranopia','achromatopsia']) {
 await cdp.send('Emulation.setEmulatedVisionDeficiency',{type:mode});
 await p.screenshot({path:`test-results/design-${mode}.png`});
}
assert.deepEqual(errors,[]);
await b.close();console.log('Design: TH/EN at 375/768/1440, contrast, map area, province navigation, mobile World, Research and manual passed.');
