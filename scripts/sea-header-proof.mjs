// The regional toolbar, measured at every width the site is read at.
//
// A release gate that checks three widths and three controls proves only what it checked. The
// defects this file now carries forward were all invisible to the previous version of it: the
// reset label wrapped inside a 62px box at every phone width, the longest metric label was
// truncated on the desktop widths it declared verified, and at 320px the country and view
// selectors clipped the values they were showing. So every width is measured, in both
// languages, and every label every control can display is measured against the space it has.
import{chromium}from'playwright';
import{selectSeaView}from'./browser-controls.mjs';
import assert from'node:assert/strict';
import{mkdir,writeFile}from'node:fs/promises';
import{measurementTarget}from'./lib/local-server.mjs';

// The native arrow and the breathing room around a selected value.
const ARROW=22;
const WIDTHS=[[320,844],[360,740],[375,740],[390,844],[430,932],[600,900],[768,1024],[851,900],[1024,768],[1440,900],[390,568]];

const target=await measurementTarget(),browser=await chromium.launch(),page=await browser.newPage(),rows=[];
const manifest=await fetch(target.base+'/version.json').then(r=>r.json());assert.ok(manifest.commit);
await mkdir('test-results/sea-header',{recursive:true});
try{for(const lang of ['th','en'])for(const [width,height]of WIDTHS){
 await page.setViewportSize({width,height});await page.goto(`${target.base}/sea.html?lang=${lang}&country=BRN`);await page.locator('body[data-ready]').waitFor();await page.evaluate(()=>document.fonts.ready);
 const r=await page.evaluate(()=>{const box=s=>document.querySelector(s).getBoundingClientRect();return{top:box('#seaMap').top,mapHeight:box('#seaMap').height,chrome:box('header.top').height+box('.scope-tools').height,overflow:document.documentElement.scrollWidth-innerWidth,mapScroll:document.querySelector('.workspace').scrollHeight-document.querySelector('.workspace').clientHeight};});
 assert.ok(r.top<=110,'more than two toolbar lines above map');assert.ok(r.mapHeight>=300,'hero map displaced');assert.equal(r.overflow,0);assert.ok(r.mapScroll<=2,'unnecessary nested map scroll');
 const control=await page.evaluate(()=>{const a=document.querySelector('#country').getBoundingClientRect(),b=document.querySelector('#fitRegion').getBoundingClientRect();return{aligned:Math.abs(a.top-b.top)<2&&Math.abs(a.height-b.height)<2,inToolbar:!!document.querySelector('.scope-tools>#fitRegion')};});assert.ok(control.aligned&&control.inToolbar,'region reset is not on the country row');
 // Every label every selector can show, at every width, in both languages.
 const clipped=await page.locator('#country,#metric,#seaView').evaluateAll((es,arrow)=>es.flatMap(e=>{if(e.clientWidth<=0)return[];const c=document.createElement('canvas').getContext('2d');c.font=getComputedStyle(e).font;return[...e.options].filter(o=>c.measureText(o.text).width+arrow>e.clientWidth).map(o=>e.id+': '+o.text);}),ARROW);
 assert.deepEqual(clipped,[],`selector labels are clipped at ${width}px`);
 // The reset is a button, not a selector: its label must sit on one line and fit the box.
 const reset=await page.locator('#fitRegion').evaluate(el=>{const cs=getComputedStyle(el),b=el.getBoundingClientRect(),c=document.createElement('canvas').getContext('2d');c.font=cs.font;const range=document.createRange();range.selectNodeContents(el);return{text:el.textContent.trim(),lines:range.getClientRects().length,box:Math.round(b.width),need:Math.round(c.measureText(el.textContent.trim()).width+parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)),title:el.title,aria:el.getAttribute('aria-label')};});
 assert.equal(reset.lines,1,`reset label wraps at ${width}px: ${reset.text}`);
 assert.ok(reset.need<=reset.box,`reset label ${reset.need}px does not fit its ${reset.box}px box at ${width}px`);
 // A shortened label must keep the whole phrase where a pointer or a screen reader can reach it.
 if(reset.text!==reset.title)assert.ok(reset.title.length>reset.text.length&&reset.aria===reset.title,`reset label "${reset.text}" loses its full phrase`);
 await selectSeaView(page,'compare');
 // The comparison table scrolls in ONE place: the frame, never the table itself.
 const table=await page.evaluate(()=>{const t=document.querySelector('.comparison table'),f=document.querySelector('.table-scroll');if(!t||!f)return{missing:true};return{tableScroll:t.scrollWidth-t.clientWidth,frameScroll:f.scrollWidth-f.clientWidth,focusable:f.getAttribute('tabindex')==='0'};});
 assert.ok(!table.missing,'the comparison table lost its scroll frame');assert.equal(table.tableScroll,0,'the comparison table scrolls inside itself');assert.ok(table.focusable,'the scroll frame cannot be reached by keyboard');
 await page.locator('#fitRegion').click();assert.equal(await page.locator('body').getAttribute('data-sea-view'),'map');assert.equal(await page.locator('#country').inputValue(),'SEA');assert.match(await page.locator('#metric').getAttribute('title'),/2023/);assert.match(await page.locator('#mapLegend').innerText(),/2023/);
 await page.locator('.boundary-note>summary').click();assert.ok(await page.locator('#geometryNote').isVisible());await page.locator('.boundary-note>summary').click();
 await page.screenshot({path:`test-results/sea-header/${lang}-${width}-${height}.png`});rows.push({lang,width,height,reset:reset.text,...r});
}await writeFile('test-results/sea-header/report.json',JSON.stringify({commit:manifest.commit,base:target.base,rows},null,2));console.log(JSON.stringify(rows));}finally{await browser.close();await target.stop();}
