import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {measurementTarget} from './lib/local-server.mjs';
const base=(await measurementTarget()).base;
const browser=await chromium.launch();const page=await browser.newPage();const errors=[],measurements=[];
page.on('pageerror',e=>errors.push(e.message));await mkdir('test-results/oct19',{recursive:true});
// Use actual painted ancestor backgrounds, including transparent navigation buttons.
async function checkNavContrast(){
 const colours=await page.locator('.bottom-nav button').evaluateAll(nodes=>nodes.filter(e=>e.checkVisibility()).map(e=>{
  const ctx=document.createElement('canvas').getContext('2d');
  const rgba=value=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data];};
  const over=(a,b)=>{const x=a[3]/255,y=b[3]/255,z=x+y*(1-x);return z?[...a.slice(0,3).map((v,i)=>(v*x+b[i]*y*(1-x))/z),z*255]:[0,0,0,0];};
  let bg=[0,0,0,0];for(let n=e;n&&bg[3]<255;n=n.parentElement)bg=over(bg,rgba(getComputedStyle(n).backgroundColor));bg=over(bg,[255,255,255,255]);
  return {text:e.textContent.trim(),fg:over(rgba(getComputedStyle(e).color),bg).slice(0,3),bg:bg.slice(0,3)};
 }));
 const luminance=rgb=>rgb.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0);
 for(const {text,fg,bg} of colours){const a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(ratio>=4.5,`${text} contrast ${ratio.toFixed(2)}: ${base}`);}
}
for(const lang of ['th','en'])for(const width of [390,700,701,768,1024,1100]){
 await page.setViewportSize({width,height:900});await page.goto(`${base}/?lang=${lang}`,{waitUntil:'domcontentloaded'});await page.locator('#kStock').filter({hasText:'M'}).waitFor();
 await checkNavContrast();await page.locator('.more-nav summary').click();await checkNavContrast();await page.locator('.more-nav summary').click();
 await page.locator('.bottom-nav [data-tab=project]').click();await checkNavContrast();assert.equal(await page.locator('.bottom-nav button[aria-pressed=true]').count(),1);
 if(width===1024)await page.screenshot({path:`test-results/oct19/after-nav-${lang}-1024.png`});
}
for(const lang of ['th','en']){
 await page.setViewportSize({width:390,height:844});await page.goto(`${base}/sea.html?lang=${lang}`,{waitUntil:'domcontentloaded'});await page.locator('body[data-ready]').first().waitFor();
 for(const [iso,key,name] of [['SGP','Enter',lang==='th'?'สิงคโปร์':'Singapore'],['BRN',' ',lang==='th'?'บรูไน':'Brunei']]){
  const dot=page.locator(`[data-locator=${iso}]`);assert.equal(await dot.getAttribute('role'),'button');assert.match(await dot.getAttribute('aria-label'),new RegExp(name));await dot.focus();await page.keyboard.press(key);
  assert.equal(await page.locator('#country').inputValue(),iso);assert.equal(await dot.getAttribute('aria-pressed'),'true');assert.equal(await page.locator(`path[data-country=${iso}]`).getAttribute('aria-pressed'),'true');
  assert.match(page.url(),new RegExp(`country=${iso}`));await page.locator('#fitRegion').click();assert.equal(await dot.getAttribute('aria-pressed'),'false');
 }
 // Double computed text once, without compounding descendant sizes. This is a stress test, not OS zoom certification.
 await page.evaluate(()=>{const nodes=[...document.querySelectorAll('body *:not(svg):not(svg *)')],sizes=nodes.map(e=>getComputedStyle(e).fontSize);nodes.forEach((e,i)=>e.style.fontSize=`${parseFloat(sizes[i])*2}px`);});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'SEA enlarged overflow');
 const stress=await page.locator('.data-status').evaluate(e=>{const s=getComputedStyle(e);return {font:parseFloat(s.fontSize),line:parseFloat(s.lineHeight)};});assert.ok(stress.line>=stress.font*1.4,'status text overlaps');
 assert.ok((await page.locator('#seaMap').boundingBox()).height>=300);await page.screenshot({path:`test-results/oct19/after-sea-enlarged-${lang}.png`});
}
for(const lang of ['th','en'])for(const width of [1440,1024,390]){
 await page.setViewportSize({width,height:900});await page.goto(`${base}/bible.html?lang=${lang}#uncertainty-worked`,{waitUntil:'domcontentloaded'});await page.locator('.prose').waitFor();await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>window.scrollTo(0,650));await page.waitForFunction(()=>Math.abs(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--reader-header'))-document.querySelector('header').getBoundingClientRect().height)<1);
 if(width>=1000){const rails=await page.evaluate(()=>({header:document.querySelector('header').getBoundingClientRect().bottom,index:document.querySelector('.index').getBoundingClientRect().top,evidence:document.querySelector('.evidence').getBoundingClientRect().top}));measurements.push({lang,width,...rails});assert.ok(rails.index>=rails.header-1,'Bible index under header');assert.ok(rails.evidence>=rails.header-1,'Bible sources under header');}
 await page.locator('#indexJump').click();assert.equal(await page.locator('#search').evaluate(e=>document.activeElement===e),true);
 await page.screenshot({path:`test-results/oct19/after-bible-${lang}-${width}.png`});
 if(width===1440){await page.addStyleTag({content:'header{padding-block:40px!important}'});await page.waitForFunction(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--reader-header'))>100);await page.evaluate(()=>window.scrollTo(0,650));const separated=await page.evaluate(()=>document.querySelector('.index').getBoundingClientRect().top>=document.querySelector('header').getBoundingClientRect().bottom-1);assert.ok(separated,'Bible rails did not follow taller header');}
}
for(const lang of ['th','en']){await page.goto(`${base}/guide-${lang}.html`,{waitUntil:'domcontentloaded'});
 // The screen map is a native disclosure now, so its content is only rendered once it is opened.
 for(const d of await page.locator('details.screen-map').all())await d.locator('summary').click();
 assert.match(await page.locator('.screen-guide').innerText(),lang==='th'?/เพิ่มเติม/:/More/);assert.match(await page.locator('#layers').innerText(),lang==='th'?/เพิ่มเติม → โลกและตลาด/:/More → World & markets/);}
assert.deepEqual(errors,[]);await writeFile('test-results/oct19/audit-browser-summary.json',JSON.stringify({base,checkedAt:new Date().toISOString(),checks:['navigation contrast including More and selected state','Singapore/Brunei keyboard, names and pressed state','regional text enlargement','Bible sticky rails and taller header','manual navigation matches live shell'],measurements,pageErrors:errors},null,2));await browser.close();console.log('PASS release audit: navigation contrast, locator keyboard, enlarged text, sticky reader and manuals.');
