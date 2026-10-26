// The regional workspace, measured at every width the site is read at.
//
// A release gate that checks three widths and three controls proves only what it checked. The
// defects this file now carries forward were all invisible to the previous version of it: the
// reset label wrapped inside a 62px box at every phone width, the longest metric label was
// truncated on the desktop widths it declared verified, and at 320px the country and view
// selectors clipped the values they were showing. So every width is measured, in both
// languages, and every label every control can display is measured against the space it has.
//
// The four regional views are measured here too. The deep audit walks them at three widths in
// Thai; this walks all of them at every width in both languages, and asks the questions the
// deep audit cannot ask — does a view push the page sideways, can its content be scrolled into
// view, and is anything hidden without a way to reach it.
import{chromium}from'playwright';
import{selectSeaView}from'./browser-controls.mjs';
import assert from'node:assert/strict';
import{mkdir,writeFile}from'node:fs/promises';
import{measurementTarget}from'./lib/local-server.mjs';

// The native arrow and the breathing room around a selected value.
const ARROW=22;
const WIDTHS=[[320,844],[360,740],[375,740],[390,844],[430,932],[600,900],[768,1024],[851,900],[1024,768],[1440,900],[390,568]];
const VIEWS=['map','evidence','compare','research'];

const target=await measurementTarget(),browser=await chromium.launch(),page=await browser.newPage(),rows=[];
const manifest=await fetch(target.base+'/version.json').then(r=>r.json());assert.ok(manifest.commit);
await mkdir('test-results/sea-header',{recursive:true});
try{for(const lang of ['th','en'])for(const [width,height]of WIDTHS){
 await page.setViewportSize({width,height});await page.goto(`${target.base}/sea.html?lang=${lang}&country=BRN`);await page.locator('body[data-ready]').waitFor();await page.evaluate(()=>document.fonts.ready);
 const r=await page.evaluate(()=>{const box=s=>document.querySelector(s).getBoundingClientRect();return{top:box('#seaMap').top,mapHeight:box('#seaMap').height,chrome:box('header.top').height+box('.scope-tools').height,overflow:document.documentElement.scrollWidth-innerWidth,mapScroll:document.querySelector('.workspace').scrollHeight-document.querySelector('.workspace').clientHeight};});
 assert.ok(r.top<=72,'compact regional chrome exceeds its 72px pointer budget');assert.ok(r.mapHeight>=300,'hero map displaced');assert.equal(r.overflow,0);assert.ok(r.mapScroll<=2,'unnecessary nested map scroll');
 if(lang==='th'&&width===390&&height===844){
  const old=await page.addStyleTag({content:'.workspace-bar{min-height:51px!important}.scope-tools select,.scope-tools>#fitRegion{min-height:44px!important}'});
  assert.ok(await page.locator('#seaMap').evaluate(e=>e.getBoundingClientRect().top)>72,'the chrome budget failed to detect the old oversized layout');
  await old.evaluate(e=>e.remove());
 }
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
 // The same view must carry the same name on every screen. A reader who changes device meets
 // one thing under two words, and the one word the phone can afford is the one that must win.
 const names=await page.evaluate(()=>{const out={};for(const o of document.querySelector('#seaView').options){const btn=document.querySelector(`button[data-sea-view="${o.value}"]`);out[o.value]={select:o.text,button:btn?btn.textContent:null};}return out;});
 for(const [view,n]of Object.entries(names)){
  if(n.button===null)continue;
  assert.equal(n.select,n.button,`the ${view} view is named "${n.select}" in the selector and "${n.button}" on the button`);
 }
 // Every view, at this width: nothing sideways, nothing hidden, nothing unreachable.
 for(const view of VIEWS){
  const btn=page.locator(`button[data-sea-view=${view}]`);
  const canSwitch=(await btn.isVisible())||(await page.locator('#seaView').isVisible());
  if(canSwitch)await selectSeaView(page,view);
  await page.waitForTimeout(120);
  const state=await page.evaluate(view=>{
   const out={view,overflowX:document.documentElement.scrollWidth-window.innerWidth,hidden:[],unreachable:[],bleed:[]};
   const visible=el=>{const b=el.getBoundingClientRect();return b.width>0&&b.height>0;};
   // Content that exists but cannot be reached by scrolling.
   for(const el of document.querySelectorAll('#countryEvidence,.table-scroll,.research-route,.comparison,.map-column,.workspace')){
    if(!visible(el))continue;
    const style=getComputedStyle(el),more=el.scrollHeight-el.clientHeight;
    if(more<=2)continue;
    if(style.overflowY==='hidden'||style.overflowY==='clip'){out.hidden.push(el.id||el.className);continue;}
    const before=el.scrollTop;el.scrollTop=999999;
    const end=el.scrollTop>=el.scrollHeight-el.clientHeight-2;el.scrollTop=before;
    if(!end)out.unreachable.push(el.id||el.className);
   }
   // Anything painted outside the viewport without a frame that clips it. On a phone the body
   // clips the page to the viewport, so this assertion has teeth only where the body does not
   // clip; the phone's equivalent failure is content hidden without a way to scroll it, which
   // the two assertions above cover.
   for(const el of document.querySelectorAll('main *')){
    if(!visible(el))continue;
    if(getComputedStyle(el).position==='fixed')continue;
    const b=el.getBoundingClientRect();
    if(b.right<=window.innerWidth+1&&b.left>=-1)continue;
    let framed=false;
    for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){const ps=getComputedStyle(p);if(ps.overflowX!=='visible'||ps.overflowY!=='visible'){framed=true;break;}}
    if(!framed)out.bleed.push(el.tagName.toLowerCase()+(el.id?'#'+el.id:''));
   }
   return out;
  },view);
  assert.equal(state.overflowX,0,`the ${view} view pushes the page sideways at ${width}px`);
  assert.deepEqual(state.hidden,[],`the ${view} view hides content it cannot scroll at ${width}px`);
  assert.deepEqual(state.unreachable,[],`the ${view} view has content that cannot be scrolled into view at ${width}px`);
  assert.deepEqual(state.bleed,[],`the ${view} view paints outside the viewport at ${width}px`);
 }
 await selectSeaView(page,'compare');
 // The comparison table scrolls in ONE place: the frame, never the table itself.
 const table=await page.evaluate(()=>{const t=document.querySelector('.comparison table'),f=document.querySelector('.table-scroll');if(!t||!f)return{missing:true};return{tableScroll:t.scrollWidth-t.clientWidth,frameScroll:f.scrollWidth-f.clientWidth,focusable:f.getAttribute('tabindex')==='0'};});
 assert.ok(!table.missing,'the comparison table lost its scroll frame');assert.equal(table.tableScroll,0,'the comparison table scrolls inside itself');assert.ok(table.focusable,'the scroll frame cannot be reached by keyboard');
 await page.locator('#fitRegion').click();assert.equal(await page.locator('body').getAttribute('data-sea-view'),'map');assert.equal(await page.locator('#country').inputValue(),'SEA');assert.match(await page.locator('#metric').getAttribute('title'),/2023/);assert.match(await page.locator('#mapLegend').innerText(),/2023/);
 await page.locator('.boundary-note>summary').click();assert.ok(await page.locator('#geometryNote').isVisible());await page.locator('.boundary-note>summary').click();
 await page.screenshot({path:`test-results/sea-header/${lang}-${width}-${height}.png`});rows.push({lang,width,height,reset:reset.text,...r});
}
// A touch screen gets a larger target without resurrecting the old padded two-band shell.
for(const lang of ['th','en']){
 const context=await browser.newContext({hasTouch:true,viewport:{width:390,height:844}}),touch=await context.newPage();
 await touch.goto(`${target.base}/sea.html?lang=${lang}`,{waitUntil:'domcontentloaded'});await touch.locator('body[data-ready]').waitFor();
 assert.ok(await touch.locator('#seaMap').evaluate(e=>e.getBoundingClientRect().top)<=88,'touch chrome exceeds its 88px budget');
 for(const id of ['country','metric','seaView','fitRegion'])assert.ok((await touch.locator('#'+id).boundingBox()).height>=36,'touch target shrank below 36px');
 await context.close();
}
await writeFile('test-results/sea-header/report.json',JSON.stringify({commit:manifest.commit,base:target.base,rows},null,2));console.log(JSON.stringify(rows));}finally{await browser.close();await target.stop();}
