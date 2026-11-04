import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {measurementTarget} from './lib/local-server.mjs';
import {gotoRetry} from './lib/browser-nav.mjs';
import {clickControl,selectSeaView} from './browser-controls.mjs';

const target=await measurementTarget(),browser=await chromium.launch();
const errors=[];
const downloadText=async(page,selector)=>{
 const event=page.waitForEvent('download');await page.locator(selector).click();
 return readFile(await (await event).path(),'utf8');
};
try{
 for(const lang of ['th','en']){
  const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/data/tgo/tver-forestry.json',route=>route.abort());
  await gotoRetry(page,`${target.base}/?lang=${lang}`);
  await page.waitForFunction(()=>document.querySelector('#kStock').textContent.includes('M'));
  await page.waitForFunction(()=>document.querySelector('#provinceMetric option[value=tver]').disabled&&document.querySelector('input[name=overlay][value=tver]').disabled);
  assert.equal(await page.locator('#provinceMetric option[value=tver]').evaluate(e=>e.disabled),true);
  assert.equal(await page.locator('input[name=overlay][value=tver]').evaluate(e=>e.disabled),true);
  await page.selectOption('#place','TH50'); // Other landscape controls survive the context outage.
  assert.equal(await page.locator('#place').inputValue(),'TH50');
  await clickControl(page,'.lenses [data-tab=project]');
  await page.locator('#example').click();
  await page.locator('#boundaryInfo').waitFor({state:'visible'});
  await clickControl(page,'.lenses [data-tab=calculate]');
  await page.locator('#calculationForm [type=submit]').click();
  await page.locator('#exportJSON').waitFor({state:'visible'});
  const report=JSON.parse(await downloadText(page,'#exportJSON'));
  assert.ok(Math.abs(report.result.net-218.863333333)<1e-6);
  assert.equal(report.tverRegistryContext.status,'unavailable');
  assert.equal(report.tverRegistryContext.provinces,null,'feed outage is not checked no matches');
  assert.equal(report.issuedCredits,null);
  const csv=await downloadText(page,'#exportCSV');
  assert.match(csv,/inputSource/);assert.match(csv,/T-VER-S-METH-13-01/);
  assert.match(csv,/not assessed/);assert.match(csv,/not issued/);assert.match(csv,/unavailable/);
  assert.match(csv,/Illustrative arithmetic example/);
  await gotoRetry(page,`${target.base}/sea.html?lang=${lang}&country=THA`);
  await page.locator('body[data-ready]').waitFor();
  await selectSeaView(page,'evidence');
  assert.ok(!(await page.locator('#sourceList').textContent()).includes('undefined'));
  assert.match(await page.locator('#sourceList').textContent(),/2000/);
  const regional=await downloadText(page,'#exportCSV');
  assert.match(regional,/"forest_pct","[^"]+","%","%"/);
  assert.match(regional,/"co2_mt","[^"]+","MtCO₂e\/yr \(CO₂\)","Mt CO₂\/yr"/);
  assert.match(regional,/"forest_removals_t_yr","[^"]+","MtCO₂\/yr","t CO₂\/yr"/);
  assert.match(regional,/"peat_stock_t_c","[^"]+","Gt C","t carbon","2000 reference year"/);
  await page.close();
 }
 assert.deepEqual(errors,[]);
 console.log('PASS exports: TH/EN phone calculation survives registry outage; CSV units, periods and evidence retained');
}finally{await browser.close();await target.stop();}
