import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {measurementTarget} from './lib/local-server.mjs';
const base=(await measurementTarget()).base;const b=await chromium.launch(),p=await b.newPage();const errors=[],measurements=[];p.on('pageerror',e=>errors.push(e.message));await mkdir('test-results/slop',{recursive:true});
for(const lang of ['th','en'])for(const width of [1440,1024,390])for(const [name,path,ready] of [['sea',`sea.html?lang=${lang}`,'body[data-ready]'],['home',`?lang=${lang}`,'#kStock'],['bible',`bible.html?lang=${lang}#sea-overview`,'.prose'],['guide',`guide-${lang}.html`,'.manual-routes'],['research',`research-${lang}.html`,'.research-intro']]){
 await p.setViewportSize({width,height:900});await p.goto(`${base}/${path}`,{waitUntil:'domcontentloaded'});await p.locator(ready).first().waitFor();if(name==='home')await p.locator('#kStock').filter({hasText:'M'}).waitFor();await p.waitForFunction(()=>[...document.querySelectorAll('link[rel=stylesheet]')].every(link=>link.sheet));await p.evaluate(async()=>{await Promise.all([document.fonts.load('16px Jost'),document.fonts.load('16px Prompt','ป่าไม้')]);await document.fonts.ready;});
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow '+name+lang+width);
 assert.match(await p.locator('body').evaluate(e=>getComputedStyle(e).fontFamily),/^Jost, Prompt/,'shared two-family typography');
 assert.ok(await p.evaluate(()=>document.fonts.check('16px Jost')&&document.fonts.check('16px Prompt','ป่าไม้')),'self-hosted fonts failed');
 if(name==='home'){const bg=await p.locator('.world-rail').evaluate(e=>getComputedStyle(e).backgroundColor);assert.equal(bg,'rgb(240, 240, 238)','support feed should not compete with map');}
 if(name==='bible'){
  assert.equal(await p.locator('.design-illustration').evaluate(e=>getComputedStyle(e).borderTopWidth),'0px');assert.equal(await p.locator('.chapter-outline').evaluate(e=>e.open),false);
  if(width===390){const top=await p.locator('.prose p').first().evaluate(e=>e.getBoundingClientRect().top);assert.ok(top<850,`phone explanation too far down ${lang}: ${top}`);measurements.push({name,lang,width,firstExplanation:top});}
  await p.locator('.chapter-outline>summary').click();assert.ok(await p.locator('[data-section]').first().isVisible());
 }
 if(name==='guide'&&width===390){assert.equal(await p.locator('.manual-contents').evaluate(e=>e.open),false);assert.equal(await p.locator('.screen-map').evaluate(e=>e.open),false);const y=await p.locator('#province h2').evaluate(e=>e.getBoundingClientRect().top);assert.ok(y<700,`task starts too low ${lang}: ${y}`);measurements.push({name,lang,width,firstTask:y});await p.locator('.manual-contents>summary').click();assert.ok(await p.locator('.manual-links a').first().isVisible());await p.locator('.screen-map>summary').click();assert.ok(await p.locator('.screen-columns').isVisible());}
 if(name==='research'){assert.ok(await p.locator('.research-byline .author-photo').evaluate(e=>e.complete&&e.naturalWidth>0));const measure=await p.locator('.thesis').evaluate(e=>({width:e.getBoundingClientRect().width,limit:parseFloat(getComputedStyle(e).maxWidth)}));assert.ok(measure.width<=measure.limit+1,'research abstract measure');}
 await p.screenshot({path:`test-results/slop/verified-${name}-${lang}-${width}.png`});
}
for(const name of ['Jost','Prompt']){const r=await p.request.get(`${base}/vendor/fonts/licenses/${name}-OFL.txt`);assert.ok(r.ok());assert.match(await r.text(),/SIL OPEN FONT LICENSE/i);}
assert.deepEqual(errors,[]);await writeFile('test-results/slop/summary.json',JSON.stringify({base,checkedAt:new Date().toISOString(),widths:[1440,1024,390],languages:['th','en'],measurements,checks:['shared self-hosted typography','font licences','map dominance','unboxed diagrams','phone task access','chapter outline disclosure','author identity and reading measure','no page overflow'],pageErrors:errors},null,2));await b.close();console.log('PASS anti-slop: TH/EN five surfaces, typography, map hierarchy, compact reading and accessible disclosures.');
