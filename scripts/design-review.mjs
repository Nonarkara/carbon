import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:8788';
await mkdir('test-results',{recursive:true});
const b=await chromium.launch();
const p=await b.newPage();
const errors=[];p.on('pageerror',e=>errors.push(e.message));
function luminance(rgb){assert.equal(rgb.length,3,'Three resolved RGB channels required');const a=rgb.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return a[0]*.2126+a[1]*.7152+a[2]*.0722}
for(const lang of ['th','en']) for(const width of [375,768,1440]){
 await p.setViewportSize({width,height:width===375?812:1000});
 await p.goto(`${base}/?lang=${lang}`,{waitUntil:'domcontentloaded'});
 await p.locator('#kStock').filter({hasText:'M'}).waitFor();
 await p.evaluate(()=>document.fonts.ready);
 const branding=await p.locator('.kabonna-mark').evaluate(async img=>{await img.decode();return {fit:getComputedStyle(img).objectFit,background:getComputedStyle(img).backgroundColor,loaded:img.naturalWidth>0}});
 assert.deepEqual(branding,{fit:'contain',background:'rgba(0, 0, 0, 0)',loaded:true});
 assert.equal(await p.locator('#installLink').getAttribute('href'),`guide-${lang}.html#install`);
 assert.match(await p.locator('#installLink').textContent(),/Android.*iPhone/);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflows');
 const shadows=await p.locator('button,.btn,.leaflet-control,.layer-panel,.overlay-legend').evaluateAll(es=>es.filter(e=>getComputedStyle(e).boxShadow!=='none').map(e=>e.id||e.className));
 assert.deepEqual(shadows,[],'Controls must remain flat, without inherited shadows');
 for(const selector of ['#exploreProvinces','#pickArea','#aboutTab','.world-value','.calc-answer','.calc-block code','.calc-block p']){
  // Resolve the node and paint its colours in one browser task. Feed refreshes
  // can replace a locator handle; CSS colours need not serialize as rgb(...).
  const pair=await p.evaluate(selector=>{
   const e=document.querySelector(selector);if(!e?.isConnected)throw Error(`Missing contrast target: ${selector}`);
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d',{willReadFrequently:true});
   const rgba=value=>{if(!CSS.supports('color',value))throw Error(`Unresolved colour for ${selector}: ${value}`);ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data];};
   const over=(front,back)=>{const fa=front[3]/255,ba=back[3]/255,alpha=fa+ba*(1-fa);return alpha?[...front.slice(0,3).map((v,i)=>(v*fa+back[i]*ba*(1-fa))/alpha),alpha*255]:[0,0,0,0];};
   let bg=[0,0,0,0];for(let n=e;n&&bg[3]<255;n=n.parentElement)bg=over(bg,rgba(getComputedStyle(n).backgroundColor));
   bg=over(bg,[255,255,255,255]);const fg=over(rgba(getComputedStyle(e).color),bg);return [fg.slice(0,3),bg.slice(0,3)];
  },selector);
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
 await p.goto(`${base}/guide-${lang}.html`,{waitUntil:'domcontentloaded'});await p.locator('.manual-routes').waitFor();
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'manual overflow');
 assert.match(await p.locator('#install').innerText(),/Android[\s\S]*iPhone/);
 assert.ok(await p.locator('.manual-brand').evaluate(img=>img.complete&&img.naturalWidth>0));
 await p.screenshot({path:`test-results/design-manual-${lang}-${width}.png`});
}
await p.setViewportSize({width:1280,height:900});
await p.goto(`${base}/?lang=en`,{waitUntil:'domcontentloaded'});await p.locator('#kStock').filter({hasText:'M'}).waitFor();
const manifest=await p.request.get(`${base}/manifest.json`).then(r=>r.json());
assert.equal(manifest.display,'standalone');
for(const file of ['ct-mark.png','ct-app.png','ct-colour.png','ct-monochrome.png','icon-180.png','icon-192.png','icon-512.png']){
 const alpha=await p.evaluate(async file=>{const img=new Image();img.src=`images/brand/${file}`;await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;let clear=0,solid=0;for(let i=3;i<d.length;i+=4){if(d[i]===0)clear++;if(d[i]>240)solid++;}return {width:c.width,height:c.height,corner:d[3],clear:clear/(d.length/4),solid:solid/(d.length/4)}},file);
 assert.equal(alpha.corner,0,`${file} background is not transparent`);
 assert.ok(alpha.clear>.2&&alpha.solid>.05,`${file} lost transparency or visible strokes`);
 if(file.startsWith('icon-')){const size=Number(file.match(/\d+/)[0]);assert.equal(alpha.width,size);assert.equal(alpha.height,size);}
}
const cdp=await p.context().newCDPSession(p);
for(const mode of ['deuteranopia','achromatopsia']) {
 await cdp.send('Emulation.setEmulatedVisionDeficiency',{type:mode});
 await p.screenshot({path:`test-results/design-${mode}.png`});
}
assert.deepEqual(errors,[]);
await b.close();console.log('Design: TH/EN at 375/768/1440, contrast, map area, province navigation, mobile World, Research and manual passed.');
