import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:8788';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/?lang=en');await page.locator('#provinceRows tr').first().waitFor({state:'attached'});
// Carbon map is the default lens: national figures, province selection, drawn box, overlays, export.
const ledger=JSON.parse(await readFile('public/data/ledger/provinces.json','utf8')),F=1.27*.47*44/12;
const mt=v=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:2}).format(v/1e6)+' M';
await page.waitForFunction(()=>document.querySelector('#kStock').textContent.includes('M'));
assert.equal(await page.locator('#kStock').innerText(),mt(ledger.national.forest_agb_mg*F));
assert.equal(await page.locator('#kRemove').innerText(),mt(ledger.national.gfw_removals_mg_co2/25));
await page.locator('#exploreProvinces').click();await page.locator('.province-row').first().waitFor();assert.equal(await page.locator('.province-row').count(),77);await page.locator('.province-row').first().click();
const cm=ledger.provinces.find(p=>p.pcode==='TH50');
await page.locator('#place').selectOption('TH50');await page.waitForFunction(()=>document.querySelector('#carbonVerdict').textContent.startsWith('Chiang Mai'));
assert.equal(await page.locator('#kStock').innerText(),mt(cm.forest_agb_mg*F));assert.equal(await page.locator('#kEmit').innerText(),mt(cm.gfw_emissions_mg_co2e/25));
await page.locator('#ledgerDetails').evaluate(e=>e.open=true);assert.match(await page.locator('#ledger').innerText(),/Climate TRACE 2024[\s\S]*Forest fires/);assert.equal(await page.locator('.fire-chart .bar').count(),12);
await page.locator('#pickArea').click();const mb=await page.locator('#map').boundingBox();
await page.mouse.move(mb.x+mb.width*.35,mb.y+mb.height*.3);await page.mouse.down();await page.mouse.move(mb.x+mb.width*.6,mb.y+mb.height*.6,{steps:8});await page.mouse.up();
await page.waitForFunction(()=>document.querySelector('#carbonVerdict').textContent.startsWith('Drawn box'));
assert.equal(await page.locator('#place').inputValue(),'box');assert.match(await page.locator('#kStock').innerText(),/\d/);assert.equal(await page.locator('#kRemove').innerText(),'—');
assert.match(await page.locator('#ledger').innerText(),/not ingested[\s\S]*Not shown as zero/);
await page.locator('#moreLayers').click();for(const v of ['stock','fnf']){await page.locator(`input[name=overlay][value=${v}]`).check();await page.waitForFunction(()=>{const i=document.querySelector('img.leaflet-image-layer');return i&&i.complete&&i.naturalWidth>0;});}
await page.locator('input[name=overlay][value=flux]').check();assert.ok(await page.locator('#overlayLegend').isVisible());
await page.locator('#pickArea').click();await page.mouse.click(mb.x+mb.width*.3,mb.y+mb.height*.3);await page.mouse.click(mb.x+mb.width*.7,mb.y+mb.height*.7);await page.waitForFunction(()=>document.querySelector('#place').value==='box');await page.waitForTimeout(600);assert.equal(await page.locator('#place').inputValue(),'box');
const ledgerDl=page.waitForEvent('download');await page.locator('#ledgerJSON').click();await (await ledgerDl).saveAs('test-results/ledger.json');
const lj=JSON.parse(await readFile('test-results/ledger.json','utf8'));assert.equal(lj.notCredits,true);assert.equal(lj.selection.kind,'box');assert.ok(lj.rows.every(r=>r.dataset&&r.unit));
await page.locator('.advanced-tools').evaluate(e=>e.open=true);await page.locator('.lenses [data-tab=project]').click();
await page.locator('#example').click();await page.locator('#boundaryInfo').waitFor({state:'visible'});
await page.locator('.advanced-tools').evaluate(e=>e.open=true);await page.locator('.lenses [data-tab=calculate]').click();await page.locator('[type=submit]').click();
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
await page.locator('.advanced-tools').evaluate(e=>e.open=true);await page.locator('.lenses [data-tab=evidence]').click();await page.locator('#equationConfirmed').check();await page.locator('#plotFile').setInputFiles('public/data/example-plots.csv');await page.locator('#usePlots').waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('#usePlots').disabled);await page.locator('#usePlots').click();assert.equal(await page.locator('#previous').inputValue(),'');await page.locator('[type=submit]').click();assert.equal(await page.locator('#result').innerText(),'');
// Prove factor edits invalidate plot-derived stock before replacing a boundary.
await page.locator('#group').selectOption('palm');assert.equal(await page.locator('#current').inputValue(),'');await page.locator('#group').selectOption('general');
await page.locator('.advanced-tools').evaluate(e=>e.open=true);await page.locator('.lenses [data-tab=project]').click();await page.locator('#boundaryFile').setInputFiles({name:'smaller.geojson',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({type:'Polygon',coordinates:[[[100,14],[100.001,14],[100.001,14.001],[100,14.001],[100,14]]]}))});await page.waitForFunction(()=>document.querySelector('#boundaryInfo').textContent.includes('smaller.geojson'));assert.equal(await page.locator('#current').inputValue(),'');
const area=await page.locator('#areaValue').innerText();await page.locator('#boundaryFile').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"type":"Point","coordinates":[100,14]}')});await page.waitForFunction(()=>!document.querySelector('#message').hidden);assert.equal(await page.locator('#areaValue').innerText(),area);
await page.locator('#reset').click();assert.equal(await page.locator('#areaValue').innerText(),'No boundary yet');
for(const width of [1280,768,390,375]){
 await page.setViewportSize({width,height:900});await page.reload();await page.locator('#provinceRows tr').first().waitFor({state:'attached'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
 if(width<=700){assert.ok(await page.locator('#kStock').isVisible());assert.match(await page.locator('#kStock').innerText(),/M/);await page.locator('.bottom-nav [data-tab=project]').click();await page.locator('#example').click();await page.locator('#boundaryInfo').waitFor({state:'visible'});await page.locator('.bottom-nav [data-tab=calculate]').click();await page.locator('[type=submit]').click();assert.match(await page.locator('#result').innerText(),/218\.86/);await page.locator('.bottom-nav [data-view=map]').click();assert.ok(await page.locator('#map').isVisible());}
 await page.screenshot({path:`test-results/viewport-${width}.png`,fullPage:true});
}
for(const lang of ['en','th']){await page.goto(base+`/guide-${lang}.html`);assert.equal(await page.locator('.doc-diagram').count(),3);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
// Research opens separately, preserving browser-local project inputs.
for(const width of [1280,768,375]){
 await page.setViewportSize({width,height:900});
 for(const lang of ['en','th']){
  await page.goto(base+`/?lang=${lang}`);
  if(width>700)await page.locator('.advanced-tools').evaluate(e=>e.open=true);await page.locator(width<=700?'.bottom-nav [data-tab=project]':'.lenses [data-tab=project]').click();await page.locator('#projectName').fill('Research preserves my project');
  // About tab: native TH/EN story, illustrations filled from the shipped ledger, research notebook one link away.
  await page.locator('#aboutTab').click();await page.locator('#aboutBody h1').waitFor({state:'visible'});
  assert.equal(await page.locator('#aboutBody figure.il').count(),9);assert.equal(await page.locator('#abFire .bar').count(),12);
  assert.match(await page.locator('#aboutBody [data-fig=forestPct]').innerText(),/^44[.,]7%$/);assert.equal(await page.locator('#abgrid rect').count(),80);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`about overflow ${lang} ${width}`);
  await page.screenshot({path:`test-results/about-${lang}-${width}.png`});
  await page.locator('#researchLink').waitFor({state:'visible'});
  assert.equal(await page.locator('#researchLink').getAttribute('href'),`research-${lang}.html`);
  const popupEvent=page.waitForEvent('popup');await page.locator('#researchLink').click();const research=await popupEvent;
  await research.waitForLoadState();
  assert.equal(await research.locator('html').getAttribute('lang'),lang);
  assert.equal(await research.locator('.research-diagram').count(),5);
  assert.equal(await research.locator('.research-toc a').count(),9);
  await research.locator('.research-toc a[href="#section-8"]').click();
  const portrait=research.locator('.author-profile img');await portrait.scrollIntoViewIfNeeded();
  await portrait.evaluate(img=>img.decode());assert.ok(await portrait.evaluate(img=>img.naturalWidth>=400));
  assert.ok(await research.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`research overflow ${lang} ${width}`);
  await research.locator('nav a[lang]').click();assert.equal(await research.locator('html').getAttribute('lang'),lang==='en'?'th':'en');
  await research.screenshot({path:`test-results/research-${lang}-${width}.png`,fullPage:true});
  await research.close();assert.equal(await page.locator('#projectName').inputValue(),'Research preserves my project');
 }
}
assert.deepEqual(errors,[]);await writeFile('test-results/browser-summary.json',JSON.stringify({base,checkedAt:new Date().toISOString(),viewports:[1440,1280,768,390,375],checks:['about tab TH/EN with ledger-driven illustrations','carbon map national figures','province selection matches ledger','drawn box','overlays','ledger export','example arithmetic','JSON export and provenance','language state','loss','unknown fire','unit switch','plot import','factor edit','boundary replacement','malformed geometry','reset','mobile navigation','guide diagrams','research navigation and language','research diagrams and portrait','research preserves input'],pageErrors:errors},null,2));await browser.close();console.log('PASS: browser flows, export, unit/provenance regressions, 5 viewports, 2 guides, bilingual research with portrait and preserved inputs; '+base);
