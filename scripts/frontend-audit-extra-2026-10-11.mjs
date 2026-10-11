// Read-only narrow-screen, simulated text-enlargement and reading-surface checks.
import {chromium} from 'playwright';import {writeFile} from 'node:fs/promises';
const b=await chromium.launch();const p=await b.newPage();const dir='test-results/frontend-audit-2026-10-11';const rows=[];
for(const lang of ['th','en']){
 await p.setViewportSize({width:320,height:568});await p.goto(`http://127.0.0.1:8788/?lang=${lang}`,{waitUntil:'domcontentloaded'});await p.locator('#kStock').filter({hasText:'M'}).waitFor();
 rows.push({lang,state:'entry-320',...(await p.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,mapHeight:document.querySelector('#map').getBoundingClientRect().height,mapTop:document.querySelector('#map').getBoundingClientRect().top})))});await p.screenshot({path:`${dir}/entry-${lang}-320x568.png`});
 await p.setViewportSize({width:375,height:812});await p.goto(`http://127.0.0.1:8788/?lang=${lang}`);await p.locator('#kStock').filter({hasText:'M'}).waitFor();
 // Text-only enlargement of actual CSS fonts; this is a stress simulation, not browser zoom certification.
 await p.evaluate(()=>{const a=[...document.querySelectorAll('body *')].map(e=>({e,size:parseFloat(getComputedStyle(e).fontSize)}));for(const {e,size} of a)e.style.fontSize=`${size*2}px`;});
 rows.push({lang,state:'text-200-percent',...(await p.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,mapHeight:document.querySelector('#map').getBoundingClientRect().height,mapTop:document.querySelector('#map').getBoundingClientRect().top,bodyHeight:document.body.getBoundingClientRect().height})))});await p.screenshot({path:`${dir}/text-200-${lang}-375.png`});
 for(const [name,path] of [['bible',`bible.html?lang=${lang}#assessment-brief`],['guide',`guide-${lang}.html`],['paper',`research-${lang}.html`]]){
  await p.goto(`http://127.0.0.1:8788/${path}`,{waitUntil:'domcontentloaded'});if(name==='bible')await p.locator('.prose').waitFor();else await p.locator('main').waitFor();
  rows.push({lang,state:name,...(await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,articleTop:document.querySelector('#article')?.getBoundingClientRect().top,headerHeight:document.querySelector('header,body>nav')?.getBoundingClientRect().height,fontSizes:[...new Set([...document.querySelectorAll('a,button,input')].filter(e=>e.checkVisibility()).map(e=>getComputedStyle(e).fontSize))]})))});await p.screenshot({path:`${dir}/${name}-${lang}-375.png`});
 }
}
await writeFile(`${dir}/extra-metrics.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));await b.close();
