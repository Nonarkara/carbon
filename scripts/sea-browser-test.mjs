import {selectSeaView} from './browser-controls.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {measurementTarget} from './lib/local-server.mjs';
import {gotoRetry} from './lib/browser-nav.mjs';
const base=(await measurementTarget()).base;
// The deployed snapshot is the source of truth for what the country panel must show, so the
// panel is checked against it rather than against a hand-written expectation.
const snap=JSON.parse(await readFile('public/data/sea/snapshot.json','utf8'));
const browser=await chromium.launch();const page=await browser.newPage({acceptDownloads:true});const errors=[];const layouts=[];
page.on('pageerror',e=>errors.push(e.message));await mkdir('test-results',{recursive:true});
for(const lang of ['th','en'])for(const width of [320,370,375,700,701,768,1440]){
 await page.setViewportSize({width,height:width===320?568:900});await gotoRetry(page, `${base}/sea.html?lang=${lang}`);await page.locator('body[data-ready]').first().waitFor();
 assert.equal(await page.locator('#countryRows tr').count(),11);assert.equal(await page.locator('#country option').count(),12);assert.equal(await page.locator('path[data-country]').count(),11);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow '+lang+width);
 assert.ok(await page.locator('#seaMap').evaluate(e=>e.getBoundingClientRect().height)>=300);
 await page.evaluate(()=>document.fonts.ready);
 for(const id of ['country','metric','fitRegion']){assert.ok(await page.locator('#'+id).isVisible());assert.ok((await page.locator('#'+id).boundingBox()).height>=28,`pointer target height ${id}`);}
 assert.match(await page.locator('#snapshotDate').textContent(),/\d{4}-\d{2}-\d{2}/);
 const layout=await page.evaluate(()=>{const m=document.querySelector('#seaMap').getBoundingClientRect();return {mapTop:m.top,mapHeight:m.height,headerHeight:document.querySelector('header').getBoundingClientRect().height,visibleMap:Math.min(m.bottom,innerHeight)-m.top};});
 layouts.push({lang,width,...layout});
 assert.ok(layout.headerHeight<=64,`single-row header budget ${lang} ${width}: ${layout.headerHeight}`);
 assert.ok(layout.mapTop<=170,`map begins within 170px ${lang} ${width}: ${layout.mapTop}`);
 assert.ok(layout.visibleMap>=300,`300px of map visible without scrolling ${lang} ${width}`);
 await page.locator('.read-menu summary').click();assert.ok(await page.locator('#bibleLink').isVisible());assert.ok(await page.locator('#thaiLink').isVisible());await page.locator('.read-menu summary').click();

 await page.selectOption('#country','TLS');assert.match(await page.locator('#countryTitle').innerText(),lang==='th'?/ติมอร์/:/Timor/);assert.match(await page.locator('#countryChapter').getAttribute('href'),/sea-tls/);
 await page.locator('#fitRegion').click();assert.equal(await page.locator('#country').inputValue(),'SEA');await page.selectOption('#country','TLS');
 // A withheld value must read as missing and publish its coverage. It must never print a zero
 // and it must never print a sum of the ten countries that do publish it.
 const MISSING=lang==='th'?'ยังไม่มีข้อมูล':'Not available',PARTIAL=lang==='th'?'ข้อมูลไม่ครบ จึงไม่แสดงยอดภูมิภาค':'Incomplete coverage: regional total withheld';
 const FIELDS={stock:'carbon_stock_t_c',loss:'tree_cover_loss_ha',peat:'peat_stock_t_c',mangrove:'mangrove_stock_t_c'};
 const checkPanel=async iso=>{
  await page.selectOption('#country',iso);
  const c=iso==='SEA'?null:snap.countries.find(x=>x.iso3===iso);
  for(const [key,field] of Object.entries(FIELDS)){
   const row=page.locator(`#countryNumbers div[data-number="${key}"]`);
   assert.equal(await row.count(),1,`${iso}: the country panel has no ${key} row`);
   const value=(await row.locator('dd').innerText()).trim(),note=(await row.locator('small').innerText()).trim();
   assert.ok(/\d{4}/.test(note),`${iso} ${key}: the source note carries no period, got "${note}"`);
   const raw=iso==='SEA'?(snap.totals[field].value):c[field];
   if(raw===null||raw===undefined){
    assert.equal(value,MISSING,`${iso} ${key}: a withheld value must read as missing, not "${value}"`);
    assert.notEqual(value,'0',`${iso} ${key}: a missing value must never print as zero`);
    if(iso==='SEA')assert.ok(note.includes(PARTIAL),`${iso} ${key}: a withheld regional total must publish its coverage, got "${note}"`);
   }else{
    assert.notEqual(value,MISSING,`${iso} ${key}: a published value must not read as missing`);
    assert.ok(await row.locator('dd .metric-unit').count(),`${iso} ${key}: a published value must carry its unit`);
   }
  }
 };
 await checkPanel('IDN');await checkPanel('SEA');await checkPanel('SGP');
 await page.selectOption('#metric','forest_net_t_yr');assert.match(page.url(),/metric=forest_net_t_yr/);
 await selectSeaView(page,'compare');await page.fill('#countrySearch','สิงคโปร์');assert.equal(await page.locator('#countryRows tr').count(),1);await page.locator('#countryRows button').click();assert.equal(await page.locator('#country').inputValue(),'SGP');
 await selectSeaView(page,'compare');await page.fill('#countrySearch','xyznoresult');assert.ok(await page.locator('#noCountries').isVisible());await page.fill('#countrySearch','');await selectSeaView(page,'map');
 const shadow=await page.locator('button').evaluateAll(nodes=>nodes.map(e=>getComputedStyle(e).boxShadow).filter(x=>x!=='none'));assert.deepEqual(shadow,[]);
 await page.locator('[data-lang=en]').click();assert.equal(await page.locator('#country').inputValue(),'SGP');assert.equal(await page.locator('html').getAttribute('lang'),'en');
 if(width===1440&&lang==='en')await page.screenshot({path:'test-results/sea-preview.png'});
 if(width===375||width===1440){await page.selectOption('#country','IDN');await page.screenshot({path:`test-results/sea-${lang}-${width}.png`,fullPage:true});}
}
const download=page.waitForEvent('download');await page.locator('#exportJSON').click();const file=await download;const json=JSON.parse(await readFile(await file.path(),'utf8'));assert.ok(json.notCredits&&json.notParcelEstimate&&json.notCorporateFootprint);assert.equal(json.selection.iso3,'IDN');assert.ok(json.receipts['gfw.csv'].sha256);
const csvEvent=page.waitForEvent('download');await page.locator('#exportCSV').click();const csv=await readFile(await (await csvEvent).path(),'utf8');assert.match(csv,/notCorporateFootprint/);assert.match(csv,/2001–2025/);
await gotoRetry(page, `${base}/sea.html?lang=en&country=bad&metric=constructor`);await page.locator('body[data-ready]').first().waitFor();assert.equal(await page.locator('#country').inputValue(),'SEA');assert.equal(await page.locator('#metric').inputValue(),'forest_pct');
await gotoRetry(page, `${base}/sea.html?lang=en&country=VNM`);await page.locator('body[data-ready]').first().waitFor();assert.equal(await page.locator('#country').inputValue(),'VNM');await page.locator('path[data-country=KHM]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#country').inputValue(),'KHM');
for(const lang of ['en','th']){await gotoRetry(page, `${base}/bible.html?lang=${lang}&group=region#sea-idn`);await page.locator('.prose').waitFor();
// The chapter counter is written by the Bible's script when its data lands; the prose above it
// is static HTML, so waiting for the prose does not wait for the counter.
await page.waitForFunction(()=>/\d+\s*\/\s*\d+/.test(document.querySelector('#count')?.textContent||''),null,{timeout:30000});assert.match(await page.locator('#count').textContent(),/17 \/ 68/);assert.equal(await page.locator('.prose table tbody tr').count(),6);await page.locator('#results a[href="#sea-mrv"]').click();await page.locator('.design-illustration svg').waitFor();assert.equal(await page.locator('.design-illustration svg').count(),1);}
await gotoRetry(page, `${base}/?lang=en`);await page.locator('#place optgroup[data-sea-route]').waitFor({state:'attached'});const old=await page.locator('#place').inputValue();await page.selectOption('#place','sea:TLS');await page.frameLocator('#regionalFrame').locator('body[data-ready]').first().waitFor();assert.equal(await page.frameLocator('#regionalFrame').locator('#country').inputValue(),'TLS');await page.selectOption('#place',old);assert.equal(await page.locator('#place').inputValue(),old);assert.equal(await page.locator('#regionalView').isVisible(),false);
await page.route('**/data/sea/snapshot.json',r=>r.fulfill({status:503,body:'unavailable'}));await gotoRetry(page, `${base}/sea.html?lang=en`);await page.waitForFunction(()=>document.querySelector('#country').disabled);assert.ok((await page.locator('#status').textContent()).length>10);await page.locator('.read-menu summary').click();assert.ok(await page.locator('#bibleLink').isVisible());
assert.deepEqual(errors,[]);await writeFile('test-results/sea-browser-summary.json',JSON.stringify({base,checkedAt:new Date().toISOString(),languages:['th','en'],widths:[320,370,375,700,701,768,1440],countries:11,layouts,checks:['country selection','metric and query persistence','Thai/English search','empty search','native scrolling','no overflow or button shadows','JSON and CSV provenance','keyboard map','regional Bible','original Thai state preserved','data outage fallback'],pageErrors:errors},null,2));await browser.close();console.log('PASS Southeast Asia: 11 countries, TH/EN, 7 widths, exports, keyboard, Bible, Thai state and data outage.');
