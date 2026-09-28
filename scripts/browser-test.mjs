import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:8788';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/?lang=en');await page.locator('#provinceRows tr').first().waitFor({state:'attached'});
assert.match(await page.locator('.brand h1').innerText(),/^คาบอนนะ/);assert.ok(await page.locator('.kabonna-mark').isVisible());
assert.match(await page.locator('#provinceRows tr').first().innerText(),/^Saraburi2561/);
// Carbon map is the default lens: national figures, province selection, drawn box, overlays, export.
const ledger=JSON.parse(await readFile('public/data/ledger/provinces.json','utf8')),mf=JSON.parse(await readFile('public/data/ledger/manifest.json','utf8')),F=1.27*.47*44/12;
const mt=v=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:2}).format(v/1e6)+' M';
await page.waitForFunction(()=>document.querySelector('#kStock').textContent.includes('M'));
assert.equal(await page.locator('#kStock').innerText(),mt(ledger.national.forest_agb_mg*F));
assert.equal(await page.locator('#kRemove').innerText(),mt(ledger.national.gfw_removals_mg_co2/25));
// Source labels on KPI hints travel from the manifest, not hardcoded strings.
assert.equal(await page.locator('#kRemoveHint').textContent(),`GFW ${mf.datasets.gfw.version.split(' ')[0]} · ${mf.datasets.gfw.period}`);
assert.ok((await page.locator('#kStockHint').textContent()).endsWith(`CCI ${mf.datasets.cci.version}`));
// The answer leads its section; the formula trace follows. Metric option labels travel from the manifest.
assert.equal(await page.locator('[data-calculation=stock]').evaluate(e=>e.children[1].className),'calc-answer');
assert.match(await page.locator('[data-calculation=stock] code').first().innerText(),new RegExp(`\\(1 \\+ ${mf.conversion.root_shoot}\\) × ${mf.conversion.carbon_fraction} × 44 / 12`));
assert.ok((await page.locator('#provinceMetric option[value=fossil]').textContent()).includes(` · ${mf.datasets.odiac.year}`));
assert.ok((await page.locator('#provinceMetric option[value=stock]').textContent()).includes(` · ${mf.datasets.cci.year}`));
assert.ok((await page.locator('#provinceMetric option[value=net]').textContent()).includes(mf.datasets.gfw.period));
await page.locator('#exploreProvinces').click();await page.locator('.province-row').first().waitFor();assert.equal(await page.locator('.province-row').count(),77);
const rankSource=()=>page.locator('.province-row small').first().textContent();
assert.ok((await rankSource()).includes(`${mf.datasets.odiac.version} · ${mf.datasets.odiac.year}`));
await page.locator('#provinceMetric').selectOption('net');assert.ok((await rankSource()).includes(`GFW · ${mf.datasets.gfw.period}`));
await page.locator('#provinceMetric').selectOption('stock');assert.ok((await rankSource()).includes(`CCI + JAXA · ${mf.datasets.cci.year}`));
await page.locator('#provinceMetric').selectOption('fossil');
// T-VER registry metric option: source label travels from the snapshot; integer counts; top province matches the registry.
await page.locator('#provinceMetric').selectOption('tver');
const tver=JSON.parse(await readFile('public/data/tgo/tver-forestry.json','utf8'));
const topTver=Object.entries(tver.provinces).sort((a,b)=>b[1].projects-a[1].projects)[0];
assert.ok((await rankSource()).includes('TGO T-VER'),'tver source label');
const tverCount=Number((await page.locator('.province-row').first().locator('b').textContent()).replace(/[^0-9]/g,''));
assert.equal(tverCount,topTver[1].projects,'top province project count matches the snapshot');
await page.locator('#provinceMetric').selectOption('fossil');
await page.locator('.province-row').first().click();
const cm=ledger.provinces.find(p=>p.pcode==='TH50');
await page.locator('#place').selectOption('TH50');await page.waitForFunction(()=>document.querySelector('#carbonVerdict').textContent.startsWith('Chiang Mai'));
assert.equal(await page.locator('#kStock').innerText(),mt(cm.forest_agb_mg*F));assert.equal(await page.locator('#kEmit').innerText(),mt(cm.gfw_emissions_mg_co2e/25));
await page.locator('#ledgerDetails').evaluate(e=>e.open=true);assert.match(await page.locator('#ledger').innerText(),/Climate TRACE 2024[\s\S]*Forest fires/);assert.equal(await page.locator('.fire-chart .bar').count(),12);
// T-VER registry ledger block: appears below the landscape ledger with a side heading, snapshot line, and project list.
assert.match(await page.locator('#ledger .tver-summary').first().innerText(),/T-VER|ทะเบียน/);assert.ok(await page.locator('#ledger .tver-item').count()>=1);assert.match(await page.locator('#ledger').innerText(),/tver\.tgo\.or\.th/);
await page.locator('#nationalView').click();assert.match(await page.locator('#ledger .tver-summary').first().innerText(),/multi-province projects and \d+ with no province named/);assert.ok((await page.locator('#ledger .tver-market').count())>=1);
// T-VER portfolio analytics: pipeline bar, methodology families, project sizes, developer table, issuance timeline.
assert.equal(await page.locator('#ledger .tver-portfolio').count(),5);assert.match(await page.locator('#ledger .tver-portfolio').first().innerText(),/12\.1%/);assert.ok(await page.locator('#ledger .tver-portfolio').first().locator('.tver-pipeline-bar i').evaluate(e=>e.style.width).then(w=>parseFloat(w)>10));assert.ok((await page.locator('#ledger .tver-portfolio table.tver-market').count())>=1);assert.match(await page.locator('#ledger').innerText(),/Royal Forest Department|กรมป่าไม้/);
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
// T-VER registry overlap check: appears below the boundary info with province name and project list.
await page.locator('#registryCheck').waitFor({state:'visible'});assert.match(await page.locator('#registryCheck .tver-check').first().innerText(),/Chiang Mai|Bangkok|Saraburi|Kanchanaburi|Phuket|เชียงใหม่|กรุงเทพ|สระบุรี|กาญจนบุรี|ภูเก็ต/);
await page.locator('.advanced-tools').evaluate(e=>e.open=true);await page.locator('.lenses [data-tab=calculate]').click();await page.locator('[type=submit]').click();
assert.match(await page.locator('#result').innerText(),/218\.86/);
const downloaded=page.waitForEvent('download');await page.locator('#exportJSON').click();const dl=await downloaded;await dl.saveAs('test-results/export.json');const report=JSON.parse(await readFile('test-results/export.json','utf8'));assert.equal(report.status,'illustrative-unverified-estimate');assert.ok(Math.abs(report.result.net-218.8633333)<.00001);assert.equal(report.issuedCredits,null);
await page.locator('[data-lang=th]').click();assert.equal(await page.locator('html').getAttribute('lang'),'th');assert.match(await page.locator('#result').innerText(),/218\.86/);assert.match(await page.locator('#provinceRows tr').first().innerText(),/^สระบุรี2561/);assert.ok((await page.locator('#provinceMetric option[value=net]').textContent()).includes(mf.datasets.gfw.period),'th metric options re-derive after langchange');
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
  // About annualisation and stock year travel from the manifest too.
  const netText=await page.locator('#abLedger .ab-net').textContent();
  const expectedNet=new Intl.NumberFormat(lang==='th'?'th-TH':'en-GB',{maximumFractionDigits:1}).format(ledger.national.gfw_net_mg_co2e/mf.datasets.gfw.years/1e6);
  assert.ok(netText.includes(expectedNet),`about net ${expectedNet} missing in: ${netText}`);
  assert.ok(netText.includes(`(${mf.datasets.cci.year})`),`about stock year missing in: ${netText}`);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`about overflow ${lang} ${width}`);
  await page.screenshot({path:`test-results/about-${lang}-${width}.png`});
  await page.locator('#researchLink').waitFor({state:'visible'});
  assert.equal(await page.locator('#researchLink').getAttribute('href'),`research-${lang}.html`);
  const popupEvent=page.waitForEvent('popup');await page.locator('#researchLink').click();const research=await popupEvent;
  await research.waitForLoadState();
  assert.equal(await research.locator('html').getAttribute('lang'),lang);
  assert.equal(await research.locator('.research-diagram').count(),7);
  assert.equal(await research.locator('.research-toc a').count(),14);
  assert.equal(await research.locator('.kabonna-poses img').count(),6);
  assert.equal(await research.locator('.sysmap').count(),1);
  await research.locator('.research-toc a[href="#section-9"]').click();
  const portrait=research.locator('.author-profile img');await portrait.scrollIntoViewIfNeeded();
  await portrait.evaluate(img=>img.decode());assert.ok(await portrait.evaluate(img=>img.naturalWidth>=400));
  assert.ok(await research.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`research overflow ${lang} ${width}`);
  await research.locator('nav a[lang]').click();assert.equal(await research.locator('html').getAttribute('lang'),lang==='en'?'th':'en');
  await research.screenshot({path:`test-results/research-${lang}-${width}.png`,fullPage:true});
  await research.close();assert.equal(await page.locator('#projectName').inputValue(),'Research preserves my project');
 }
}
assert.deepEqual(errors,[]);await writeFile('test-results/browser-summary.json',JSON.stringify({base,checkedAt:new Date().toISOString(),viewports:[1440,1280,768,390,375],checks:['about tab TH/EN with ledger-driven illustrations','carbon map national figures','manifest-derived KPI and source labels','answers-first calculation trace','manifest-travel metric options','province selection matches ledger','drawn box','overlays','ledger export','example arithmetic','JSON export and provenance','language state','loss','unknown fire','unit switch','plot import','factor edit','boundary replacement','malformed geometry','reset','mobile navigation','guide diagrams','research navigation and language','research diagrams and portrait','research open-data credits section','research preserves input'],pageErrors:errors},null,2));await browser.close();console.log('PASS: browser flows, export, unit/provenance regressions, 5 viewports, 2 guides, bilingual research with portrait and preserved inputs; '+base);
