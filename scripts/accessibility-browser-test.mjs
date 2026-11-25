import {clickControl} from './browser-controls.mjs';
// Test-only axe engine plus keyboard checks; not a formal conformance opinion.
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {measurementTarget} from './lib/local-server.mjs';
const target=await measurementTarget();const browser=await chromium.launch();const findings=[];
try{
 for(const lang of ['th','en'])for(const width of [390,1440])for(const [route,ready] of [[`/?lang=${lang}`,'#kStock'],[`/sea?lang=${lang}`,'#seaMap'],[`/bible.html?lang=${lang}`,'#article h1'],[`/research-${lang}.html`,'.research-layout']]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce'});const page=await context.newPage();
  await page.goto(target.base+route);if(route.startsWith('/sea?'))await page.locator('#seaMap .leaflet-pane').first().waitFor({state:'attached'});else await page.locator(ready).first().waitFor();await page.evaluate(()=>document.fonts.ready);
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  findings.push({route,width,violations:result.violations.map(({id,impact,description,nodes})=>({id,impact,description,nodes:nodes.map(({target,failureSummary})=>({target,failureSummary}))}))});
  if(route.startsWith('/?')){
   await clickControl(page,'.advanced-tools>summary');await clickControl(page,'.lenses [data-tab=project]');
   const project=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
   findings.push({route:route+' [Project]',width,violations:project.violations.map(({id,impact,description,nodes})=>({id,impact,description,nodes:nodes.map(({target,failureSummary})=>({target,failureSummary}))}))});
  }
  // Keyboard focus must be visible and must never disappear into a hidden iframe/control.
  await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>{const e=document.activeElement;return e!==document.body&&e.checkVisibility();}),`first keyboard action ${route} ${width}`);
  if(route.startsWith('/?')&&width===1440){
   await page.addStyleTag({content:'html{font-size:200%!important}'});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'200% desktop toolbar overflows');
   const overlap=await page.locator('.top :is(select,button,summary)').evaluateAll(es=>{const boxes=es.filter(e=>e.checkVisibility()).map(e=>({text:e.textContent,b:e.getBoundingClientRect()})).filter(x=>x.b.width>1&&x.b.height>1);return boxes.flatMap((a,i)=>boxes.slice(i+1).filter(c=>Math.min(a.b.right,c.b.right)-Math.max(a.b.left,c.b.left)>2&&Math.min(a.b.bottom,c.b.bottom)-Math.max(a.b.top,c.b.top)>2).map(c=>[a.text,c.text]));});
   assert.deepEqual(overlap,[],'200% desktop toolbar controls overlap');
  }
  await context.close();
 }
 await mkdir('test-results',{recursive:true});await writeFile('test-results/accessibility.json',JSON.stringify(findings,null,2)+'\n');
 const serious=findings.flatMap(f=>f.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>({route:f.route,width:f.width,...v})));
 console.log(JSON.stringify(serious,null,2));assert.equal(serious.length,0,'serious/critical axe findings; details in test-results/accessibility.json');
 console.log(`PASS accessibility: ${findings.length} route/language/viewport scans + first keyboard action. Human/device checks remain separate.`);
}finally{await browser.close();await target.stop();}
