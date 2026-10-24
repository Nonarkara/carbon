import{chromium}from'playwright';
import assert from'node:assert/strict';
import{mkdir,writeFile}from'node:fs/promises';
import{measurementTarget}from'./lib/local-server.mjs';
const target=await measurementTarget(),browser=await chromium.launch(),page=await browser.newPage(),rows=[];
const manifest=await fetch(target.base+'/version.json').then(r=>r.json());assert.ok(manifest.commit);
await mkdir('test-results/sea-header',{recursive:true});
try{for(const lang of ['th','en'])for(const [width,height]of[[390,844],[1024,768],[1440,900],[390,568]]){
 await page.setViewportSize({width,height});await page.goto(`${target.base}/sea.html?lang=${lang}&country=BRN`);await page.locator('body[data-ready]').waitFor();await page.evaluate(()=>document.fonts.ready);
 const r=await page.evaluate(()=>{const box=s=>document.querySelector(s).getBoundingClientRect();return{top:box('#seaMap').top,mapHeight:box('#seaMap').height,chrome:box('header.top').height+box('.scope-tools').height,overflow:document.documentElement.scrollWidth-innerWidth,mapScroll:document.querySelector('.workspace').scrollHeight-document.querySelector('.workspace').clientHeight};});
 assert.ok(r.top<=110,'more than two toolbar lines above map');assert.ok(r.mapHeight>=300,'hero map displaced');assert.equal(r.overflow,0);assert.ok(r.mapScroll<=2,'unnecessary nested map scroll');
 await page.locator('.boundary-note>summary').click();assert.ok(await page.locator('#geometryNote').isVisible());await page.locator('.boundary-note>summary').click();
 await page.screenshot({path:`test-results/sea-header/${lang}-${width}-${height}.png`});rows.push({lang,width,height,...r});
}await writeFile('test-results/sea-header/report.json',JSON.stringify({commit:manifest.commit,base:target.base,rows},null,2));console.log(JSON.stringify(rows));}finally{await browser.close();await target.stop();}
