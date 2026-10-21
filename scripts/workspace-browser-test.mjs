import {selectSeaView} from './browser-controls.mjs';
import{chromium}from'playwright';
import assert from'node:assert/strict';
import{mkdir,writeFile}from'node:fs/promises';
import{clickControl}from'./browser-controls.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:8788',b=await chromium.launch(),p=await b.newPage(),errors=[],checks=[];
p.on('pageerror',e=>errors.push(e.message));await mkdir('test-results/workspace',{recursive:true});
for(const lang of ['th','en'])for(const width of [320,390,768,1024,1440]){
 await p.setViewportSize({width,height:900});await p.goto(`${base}/sea.html?lang=${lang}`);await p.locator('body[data-ready]').first().waitFor();await p.evaluate(()=>document.fonts.ready);
 const toolbar=await p.locator('.scope-tools').evaluate(e=>{const r=e.getBoundingClientRect(),items=[...e.children].map(e=>e.getBoundingClientRect());return{height:r.height,centres:items.map(b=>b.y+b.height/2)};});assert.ok(toolbar.height<=54,'toolbar wraps into multiple lines');assert.ok(Math.max(...toolbar.centres)-Math.min(...toolbar.centres)<2,'country, metric and view not aligned');
 const geometry=await p.evaluate(()=>{const box=s=>document.querySelector(s).getBoundingClientRect();return{bar:box('#workspaceBar').height,map:box('#seaMap').height,row:box('.workspace').height,evidence:box('#countryEvidence').height,mapColumn:box('.map-column').height,pageHeight:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth-innerWidth};});
 assert.ok(geometry.bar<=56);assert.equal(geometry.overflow,0);assert.ok(geometry.pageHeight<=902,'regional map creates page scroll');if(width>850){assert.ok(Math.abs(geometry.evidence-geometry.mapColumn)<2);assert.ok(geometry.pageHeight<=902,'map view becomes a long page');assert.ok(geometry.map>=450);}
 assert.equal(await p.locator('.comparison').isVisible(),false);assert.equal(await p.locator('.research-route').isVisible(),false);
 await selectSeaView(p,'compare');assert.equal(await p.locator('#countryRows tr').count(),11);assert.ok(await p.locator('.table-scroll').isVisible());
 const rows=await p.locator('#countryRows tr').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));assert.ok(rows.every(h=>h<=52),'country rows have excess vertical space');assert.equal(await p.locator('button[data-sea-view][aria-pressed=true]').count(),1);
 await p.locator('#countrySearch').fill('BRN');await p.locator('#countryRows button').click();assert.equal(await p.locator('#country').inputValue(),'BRN');assert.equal(await p.locator('.comparison').isVisible(),false);if(width<=850)assert.ok(await p.locator('#countryEvidence').isVisible());
 await selectSeaView(p,'research');assert.equal(await p.locator('#readingRoutes a').count(),9);await p.locator('#readingRoutes a').last().focus();assert.ok(await p.evaluate(()=>document.querySelector('#workspaceBar').getBoundingClientRect().top>=0));
 await selectSeaView(p,'map');if([390,1024,1440].includes(width))await p.screenshot({path:`test-results/workspace/sea-${lang}-${width}.png`});
 await p.goto(`${base}/?lang=${lang}`);await p.locator('#place optgroup[data-sea-route]').waitFor({state:'attached'});await p.locator('#kStock').filter({hasText:'M'}).waitFor();
 await clickControl(p,'.advanced-tools>summary');await clickControl(p,'.lenses [data-tab=project]');await p.locator('#projectName').fill('Local project — retain me');
 await p.evaluate(()=>window.originalWorkspaceBar=document.querySelector('#workspaceBar'));
 await p.selectOption('#place','sea:BRN');const f=p.frameLocator('#regionalFrame');await f.locator('body[data-ready]').first().waitFor();assert.equal(await f.locator('#country').inputValue(),'BRN');assert.ok(await f.locator('header').isHidden());
 assert.ok(await p.evaluate(()=>window.originalWorkspaceBar===document.querySelector('#workspaceBar')));assert.ok(await p.locator('#workspaceBar').isVisible());assert.equal(p.frames().length,2);
 await f.locator('#metric').selectOption('carbon_stock_t_c');await selectSeaView(f,'compare');await f.locator('#countrySearch').fill('Singapore');await p.locator(`[data-lang=${lang==='th'?'en':'th'}]`).click();await f.locator('body[data-ready]').first().waitFor();await p.waitForFunction(()=>document.querySelector('#regionalFrame').contentDocument.documentElement.lang===document.documentElement.lang);
 assert.equal(await f.locator('body').getAttribute('data-sea-view'),'compare');assert.equal(await f.locator('#countrySearch').inputValue(),'Singapore');assert.equal(await f.locator('#metric').inputValue(),'carbon_stock_t_c');assert.equal(await f.locator('#country').inputValue(),'BRN');
 await p.selectOption('#place','TH');assert.ok(await p.locator('#regionalView').isHidden());await clickControl(p,'.advanced-tools>summary');await clickControl(p,'.lenses [data-tab=project]');assert.equal(await p.locator('#projectName').inputValue(),'Local project — retain me');
 checks.push({lang,width,...geometry,rows});
}
// Simulate old cached bare asset URLs: current HTML must request content-versioned entries.
 await p.route('**/css/sea.css',r=>r.fulfill({contentType:'text/css',body:'/* obsolete toolbar layout */'}));
 await p.route('**/js/sea.js',r=>r.fulfill({contentType:'application/javascript',body:'throw new Error("obsolete entry module")'}));
 await p.goto(`${base}/sea.html?lang=th&country=BRN`);await p.locator('body[data-ready]').waitFor();
 assert.equal(await p.locator('#country').inputValue(),'BRN');
 const entries=await p.locator('link[rel=stylesheet],script[src]').evaluateAll(es=>es.map(e=>e.getAttribute('href')||e.getAttribute('src')));assert.ok(entries.every(s=>/\?v=[a-f0-9]{12}$/.test(s)),'unversioned page assets permit a mixed release');
 assert.equal(await p.locator('#seaView option[value=evidence]').textContent(),'หลักฐาน');
 assert.ok(await p.locator('.scope-tools').evaluate(e=>e.getBoundingClientRect().height<=54));
 assert.deepEqual(errors,[]);await writeFile('test-results/workspace/summary.json',JSON.stringify({base,checks,errors},null,2));await b.close();console.log('PASS shared workspace: persistent thin bar, bounded views, compact table, country/metric/language and Thai inputs preserved.');
