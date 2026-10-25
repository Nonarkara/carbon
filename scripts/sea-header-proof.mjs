import{chromium}from'playwright';
import{selectSeaView}from'./browser-controls.mjs';
import assert from'node:assert/strict';
import{mkdir,writeFile}from'node:fs/promises';
import{measurementTarget}from'./lib/local-server.mjs';
const target=await measurementTarget(),browser=await chromium.launch(),page=await browser.newPage(),rows=[];
const manifest=await fetch(target.base+'/version.json').then(r=>r.json());assert.ok(manifest.commit);
await mkdir('test-results/sea-header',{recursive:true});
try{for(const lang of ['th','en'])for(const [width,height]of[[390,844],[375,740],[1024,768],[1440,900],[390,568]]){
 await page.setViewportSize({width,height});await page.goto(`${target.base}/sea.html?lang=${lang}&country=BRN`);await page.locator('body[data-ready]').waitFor();await page.evaluate(()=>document.fonts.ready);
 const r=await page.evaluate(()=>{const box=s=>document.querySelector(s).getBoundingClientRect();return{top:box('#seaMap').top,mapHeight:box('#seaMap').height,chrome:box('header.top').height+box('.scope-tools').height,overflow:document.documentElement.scrollWidth-innerWidth,mapScroll:document.querySelector('.workspace').scrollHeight-document.querySelector('.workspace').clientHeight};});
 assert.ok(r.top<=110,'more than two toolbar lines above map');assert.ok(r.mapHeight>=300,'hero map displaced');assert.equal(r.overflow,0);assert.ok(r.mapScroll<=2,'unnecessary nested map scroll');
 const control=await page.evaluate(()=>{const a=document.querySelector('#country').getBoundingClientRect(),b=document.querySelector('#fitRegion').getBoundingClientRect();return{aligned:Math.abs(a.top-b.top)<2&&Math.abs(a.height-b.height)<2,inToolbar:!!document.querySelector('.scope-tools>#fitRegion')};});assert.ok(control.aligned&&control.inToolbar,'region reset is not on the country row');
 if(width===390||width===375){const clipped=await page.locator('#country,#metric,#seaView').evaluateAll(es=>es.flatMap(e=>{const c=document.createElement('canvas').getContext('2d');c.font=getComputedStyle(e).font;return[...e.options].filter(o=>c.measureText(o.text).width+22>e.clientWidth).map(o=>e.id+': '+o.text);}));assert.deepEqual(clipped,[],'selector labels are clipped');}
 await selectSeaView(page,'compare');await page.locator('#fitRegion').click();assert.equal(await page.locator('body').getAttribute('data-sea-view'),'map');assert.equal(await page.locator('#country').inputValue(),'SEA');assert.match(await page.locator('#metric').getAttribute('title'),/2023/);assert.match(await page.locator('#mapLegend').innerText(),/2023/);
 await page.locator('.boundary-note>summary').click();assert.ok(await page.locator('#geometryNote').isVisible());await page.locator('.boundary-note>summary').click();
 await page.screenshot({path:`test-results/sea-header/${lang}-${width}-${height}.png`});rows.push({lang,width,height,...r});
}await writeFile('test-results/sea-header/report.json',JSON.stringify({commit:manifest.commit,base:target.base,rows},null,2));console.log(JSON.stringify(rows));}finally{await browser.close();await target.stop();}
