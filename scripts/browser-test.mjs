import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:8788';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/?lang=en');await page.locator('#provinceRows tr').first().waitFor({state:'attached'});
await page.locator('#example').click();await page.locator('#boundaryInfo').waitFor({state:'visible'});
await page.locator('.lenses [data-tab=calculate]').click();await page.locator('[type=submit]').click();
assert.match(await page.locator('#result').innerText(),/218\.86/);
const downloaded=page.waitForEvent('download');await page.locator('#exportJSON').click();const dl=await downloaded;await dl.saveAs('test-results/export.json');const report=JSON.parse(await readFile('test-results/export.json','utf8'));assert.equal(report.status,'illustrative-unverified-estimate');assert.ok(Math.abs(report.result.net-218.8633333)<.00001);assert.equal(report.issuedCredits,null);
await page.locator('[data-lang=th]').click();assert.equal(await page.locator('html').getAttribute('lang'),'th');assert.match(await page.locator('#result').innerText(),/218\.86/);
await page.screenshot({path:'test-results/desktop-th.png',fullPage:true});
await page.locator('[data-lang=en]').click();
await page.locator('#current').fill('900');assert.equal(await page.locator('#result').innerText(),'');await page.locator('[type=submit]').click();assert.match(await page.locator('#result').innerText(),/Carbon loss/);
await page.locator('#canopyDeath').selectOption('unknown');await page.locator('[type=submit]').click();assert.match(await page.locator('#message').innerText(),/fire/i);assert.equal(await page.locator('#result').innerText(),'');
await page.locator('#canopyDeath').selectOption('no');
// Prove unit transitions cannot silently reinterpret the baseline.
await page.locator('#unit').selectOption('co2');assert.equal(await page.locator('#previous').inputValue(),'');assert.equal(await page.locator('#current').inputValue(),'');await page.locator('#previous').fill('100');
await page.locator('.lenses [data-tab=evidence]').click();await page.locator('#equationConfirmed').check();await page.locator('#plotFile').setInputFiles('public/data/example-plots.csv');await page.locator('#usePlots').waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('#usePlots').disabled);await page.locator('#usePlots').click();assert.equal(await page.locator('#previous').inputValue(),'');await page.locator('[type=submit]').click();assert.equal(await page.locator('#result').innerText(),'');
// Prove factor edits invalidate plot-derived stock before replacing a boundary.
await page.locator('#group').selectOption('palm');assert.equal(await page.locator('#current').inputValue(),'');await page.locator('#group').selectOption('general');
await page.locator('.lenses [data-tab=project]').click();await page.locator('#boundaryFile').setInputFiles({name:'smaller.geojson',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({type:'Polygon',coordinates:[[[100,14],[100.001,14],[100.001,14.001],[100,14.001],[100,14]]]}))});await page.waitForFunction(()=>document.querySelector('#boundaryInfo').textContent.includes('smaller.geojson'));assert.equal(await page.locator('#current').inputValue(),'');
const area=await page.locator('#areaValue').innerText();await page.locator('#boundaryFile').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"type":"Point","coordinates":[100,14]}')});await page.waitForFunction(()=>!document.querySelector('#message').hidden);assert.equal(await page.locator('#areaValue').innerText(),area);
await page.locator('#reset').click();assert.equal(await page.locator('#areaValue').innerText(),'No boundary yet');
for(const width of [1280,768,390,375]){
 await page.setViewportSize({width,height:900});await page.reload();await page.locator('#provinceRows tr').first().waitFor({state:'attached'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
 if(width<=700){await page.locator('.bottom-nav [data-tab=project]').click();await page.locator('#example').click();await page.locator('#boundaryInfo').waitFor({state:'visible'});await page.locator('.bottom-nav [data-tab=calculate]').click();await page.locator('[type=submit]').click();assert.match(await page.locator('#result').innerText(),/218\.86/);await page.locator('.bottom-nav [data-view=map]').click();assert.ok(await page.locator('#map').isVisible());}
 await page.screenshot({path:`test-results/viewport-${width}.png`,fullPage:true});
}
for(const lang of ['en','th']){await page.goto(base+`/guide-${lang}.html`);assert.equal(await page.locator('.doc-diagram').count(),3);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
// Research opens separately, preserving browser-local project inputs.
for(const width of [1280,768,375]){
 await page.setViewportSize({width,height:900});
 for(const lang of ['en','th']){
  await page.goto(base+`/?lang=${lang}`);
  await page.locator('#researchLink').waitFor({state:'visible'});
  assert.equal(await page.locator('#researchLink').getAttribute('href'),`research-${lang}.html`);
  if(width<=700)await page.locator('.bottom-nav [data-tab=project]').click();
  await page.locator('#projectName').fill('Research preserves my project');
  const popupEvent=page.waitForEvent('popup');await page.locator('#researchLink').click();const research=await popupEvent;
  await research.waitForLoadState();
  assert.equal(await research.locator('html').getAttribute('lang'),lang);
  assert.equal(await research.locator('.research-diagram').count(),4);
  assert.equal(await research.locator('.research-toc a').count(),8);
  await research.locator('.research-toc a[href="#section-7"]').click();
  const portrait=research.locator('.author-profile img');await portrait.scrollIntoViewIfNeeded();
  await portrait.evaluate(img=>img.decode());assert.ok(await portrait.evaluate(img=>img.naturalWidth>=400));
  assert.ok(await research.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`research overflow ${lang} ${width}`);
  await research.locator('nav a[lang]').click();assert.equal(await research.locator('html').getAttribute('lang'),lang==='en'?'th':'en');
  await research.screenshot({path:`test-results/research-${lang}-${width}.png`,fullPage:true});
  await research.close();assert.equal(await page.locator('#projectName').inputValue(),'Research preserves my project');
 }
}
assert.deepEqual(errors,[]);await writeFile('test-results/browser-summary.json',JSON.stringify({base,checkedAt:new Date().toISOString(),viewports:[1440,1280,768,390,375],checks:['example arithmetic','JSON export and provenance','language state','loss','unknown fire','unit switch','plot import','factor edit','boundary replacement','malformed geometry','reset','mobile navigation','guide diagrams','research navigation and language','research diagrams and portrait','research preserves input'],pageErrors:errors},null,2));await browser.close();console.log('PASS: browser flows, export, unit/provenance regressions, 5 viewports, 2 guides, bilingual research with portrait and preserved inputs; '+base);
