// Read-only evidence capture for the 11 October 2026 frontend audit. No application changes.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:8788';
const dir='test-results/frontend-audit-2026-10-11';await mkdir(dir,{recursive:true});
const browser=await chromium.launch();const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const cases=[];
async function measure(){return page.evaluate(()=>{
 const selectors=['.top','.brand','.brand h1','.top-right','.search','.langs','#aboutTab','#guideLink','.quick-tools','.advanced-tools','.kpis','.stage','#map','.overlay-legend','.bottom-nav','.foot','.brand-strip','.world-rail','.rail'];
 const box=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,w:r.width,h:r.height,font:s.fontSize,line:s.lineHeight,border:s.borderWidth,display:s.display,visible:e.checkVisibility({visibilityProperty:true,contentVisibilityAuto:true})};};
 const boxes=Object.fromEntries(selectors.map(sel=>[sel,document.querySelector(sel)?box(document.querySelector(sel)):null]));
 const visible=[...document.querySelectorAll('body *')].filter(e=>e.checkVisibility({visibilityProperty:true,contentVisibilityAuto:true}));
 const controlData=visible.filter(e=>e.matches('button,select,summary,a.toplink')).map(e=>({text:e.textContent.trim().slice(0,70),selector:e.id||e.className,...box(e)}));
 const aboveMap=controlData.filter(e=>e.y<boxes['#map'].y&&e.x+e.w>0&&e.x<innerWidth&&e.y+e.h>0); 
 const small=controlData.filter(e=>e.w<44||e.h<44);
 const textNodes=visible.filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>({text:e.textContent.trim().slice(0,80),font:getComputedStyle(e).fontSize,face:getComputedStyle(e).fontFamily,box:box(e)}));
 const geometric=visible.filter(e=>parseFloat(getComputedStyle(e).borderTopLeftRadius)>0).map(e=>({tag:e.tagName,id:e.id,cls:e.className,radius:getComputedStyle(e).borderRadius}));
 const shadows=visible.filter(e=>getComputedStyle(e).boxShadow!=='none'||getComputedStyle(e).textShadow!=='none').map(e=>e.id||e.tagName);
 const map=boxes['#map'],legend=boxes['.overlay-legend'];const mapShare=map.w*map.h/(innerWidth*innerHeight);
 const occlusion=legend&&legend.visible?Math.max(0,Math.min(map.x+map.w,legend.x+legend.w)-Math.max(map.x,legend.x))*Math.max(0,Math.min(map.y+map.h,legend.y+legend.h)-Math.max(map.y,legend.y))/(map.w*map.h):0;
 return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,boxes,mapShare,legendOcclusion:occlusion,aboveMapControls:aboveMap.length,controlData,smallControls:small,textSizes:[...new Set(textNodes.map(t=>t.font))],textNodes,rounded:geometric,shadows,version:document.querySelector('#version').textContent};
});}
for(const lang of ['th','en'])for(const [width,height] of [[375,667],[375,812],[390,844],[700,900],[701,900],[768,1024],[1280,900],[1440,900]]){
 await page.setViewportSize({width,height});await page.goto(`${base}/?lang=${lang}`,{waitUntil:'domcontentloaded'});await page.locator('#kStock').filter({hasText:'M'}).waitFor();await page.evaluate(()=>document.fonts.ready);
 const m=await measure();cases.push({lang,state:'entry',...m});await page.screenshot({path:`${dir}/entry-${lang}-${width}x${height}.png`});
 console.log(JSON.stringify({lang,width,height,mapTop:m.boxes['#map'].y,mapHeight:m.boxes['#map'].h,mapShare:+(m.mapShare*100).toFixed(1),headerHeight:m.boxes['.top'].h,footerHeight:m.boxes['.foot'].h,legendShare:+(m.legendOcclusion*100).toFixed(1),overflow:m.scrollWidth>width,smallControls:m.smallControls.length,aboveMapControls:m.aboveMapControls}));
}
for(const lang of ['th','en']){
 await page.setViewportSize({width:375,height:812});await page.goto(`${base}/?lang=${lang}`);await page.locator('#kStock').filter({hasText:'M'}).waitFor();
 await page.locator('#pickArea').click();await page.screenshot({path:`${dir}/draw-${lang}-375.png`});cases.push({lang,state:'draw',...await measure()});
 await page.locator('#exploreProvinces').click();await page.locator('.province-row').first().waitFor();await page.screenshot({path:`${dir}/provinces-${lang}-375.png`});cases.push({lang,state:'provinces',...await measure()});
 await page.locator('.province-row').first().click();await page.screenshot({path:`${dir}/province-selected-${lang}-375.png`});cases.push({lang,state:'province-selected',...await measure()});
 await page.locator('#moreLayers').click();await page.locator('.layer-panel').waitFor({state:'visible'});await page.screenshot({path:`${dir}/layers-${lang}-375.png`});cases.push({lang,state:'layers',...await measure()});
 await page.locator('#aboutTab').click();await page.locator('#aboutBody').waitFor({state:'visible'});await page.screenshot({path:`${dir}/research-${lang}-375.png`});cases.push({lang,state:'research',...await measure()});
}
await writeFile(`${dir}/metrics.json`,JSON.stringify({base,date:'2026-10-11',cases,errors},null,2));await browser.close();console.log('Saved audit evidence',dir,'page errors',errors.length);
