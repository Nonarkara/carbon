// Live verification: prove the deployed bytes behave, and capture what a reader sees.
//
// A deploy that returns 200 is not a release. This opens the live regional workspace, walks
// its views, checks that the country panel and the comparison table carry their units and
// periods, and captures the screens a reader actually gets.
//
// Every wait here is for the thing the next assertion reads. A fixed pause is a guess about
// the network; against a cold edge a guess is how a verification fails a site that is fine.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {gotoRetry} from './lib/browser-nav.mjs';
import {clickControl} from './browser-controls.mjs';

const base=process.argv[2]||'https://carbon.nonarkara.org';
const out='test-results/live';
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const page=await browser.newPage({acceptDownloads:true});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));

// The regional workspace, in both languages, at a phone and a desktop width.
for(const lang of ['th','en']){
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:width<=390?700:900});
  await gotoRetry(page,`${base}/sea.html?lang=${lang}`);
  await page.locator('body[data-ready]').first().waitFor({timeout:30000});

  // Every view must open and must show its own content.
  for(const view of ['map','evidence','compare','research']){
   await page.evaluate(v=>{
    const btn=document.querySelector(`button[data-sea-view="${v}"]`);
    if(btn&&btn.getBoundingClientRect().width>0){btn.click();return;}
    const sel=document.querySelector('#seaView');
    if(sel){sel.value=v;sel.dispatchEvent(new Event('change',{bubbles:true}));}
   },view);
   await page.waitForFunction(v=>document.body.dataset.seaView===v,view,{timeout:30000});
  }

  // One name per view: the phone selector and the desktop button must not drift apart.
  const names=await page.evaluate(()=>{const out={};for(const o of document.querySelector('#seaView').options){const btn=document.querySelector(`button[data-sea-view="${o.value}"]`);out[o.value]={select:o.text,button:btn?btn.textContent:null};}return out;});
  for(const [view,n] of Object.entries(names)){
   if(n.button===null)continue;
   assert.equal(n.select,n.button,`${lang}@${width}: the ${view} view is named "${n.select}" in the selector and "${n.button}" on the button`);
  }

  // The country panel must carry a unit and a dated source on every published number.
  await page.evaluate(()=>{
   const sel=document.querySelector('#seaView');
   sel.value='evidence';sel.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.waitForFunction(()=>document.body.dataset.seaView==='evidence'&&document.querySelectorAll('#countryNumbers div[data-number]').length>=9,null,{timeout:30000});
  const rows=page.locator('#countryNumbers div[data-number]');
  assert.ok(await rows.count()>=9,`${lang}@${width}: the country panel has ${await rows.count()} rows`);
  for(const row of await rows.all()){
   const note=(await row.locator('small').innerText()).trim();
   assert.ok(/\d{4}/.test(note),`${lang}@${width}: a country number has no dated source note`);
  }
  // The comparison table must keep its header and its periods.
  await page.evaluate(()=>{
   const sel=document.querySelector('#seaView');
   sel.value='compare';sel.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.waitForFunction(()=>document.body.dataset.seaView==='compare'&&document.querySelectorAll('#countryRows tr').length===11,null,{timeout:30000});
  assert.equal(await page.locator('#countryRows tr').count(),11,`${lang}@${width}: the comparison table is incomplete`);
  const head=await page.locator('#countryHead').innerText();
  for(const period of ['2000','2001–2025','2023'])assert.ok(head.includes(period),`${lang}@${width}: the table header lost the period ${period}`);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${lang}@${width}: the page scrolls sideways`);
  await page.screenshot({path:`${out}/sea-compare-${lang}-${width}.png`,fullPage:false});
 }
}

// The credit chapter with the new atmospheric-layers figure.
for(const lang of ['th','en']){
 await page.setViewportSize({width:1440,height:900});
 await gotoRetry(page,`${base}/bible.html?lang=${lang}#sea-what-is-a-credit`);
 await page.locator('figure.credit-figure').first().waitFor({timeout:30000});
 assert.equal(await page.locator('figure.credit-figure').count(),3,`${lang}: the credit chapter is missing a figure`);
 const text=await page.locator('#article').innerText();
 assert.ok(lang==='en'?text.includes('Burning does not damage the ozone layer'):text.includes('การเผาไหม้ไม่ได้ทำลายชั้นโอโซน'),`${lang}: the ozone correction is not on the page`);
 await page.locator('figure.credit-figure').nth(1).screenshot({path:`${out}/credit-layers-${lang}.png`});
}

// The national workbench must compute and export, not merely paint its map.
for(const lang of ['th','en'])for(const width of [390,1440]){
 await page.setViewportSize({width,height:900});
 await gotoRetry(page,`${base}/?lang=${lang}`);
 await page.locator('#kStock').filter({hasText:'M'}).waitFor({timeout:30000});
 if(lang==='th'&&width===390){
  const headers=await fetch(base+'/').then(r=>r.headers.get('content-security-policy'));
  assert.ok(headers?.includes("connect-src 'self' https://photon.komoot.io;"),'live policy blocks place search');
  await page.locator('.geocode-wrap>summary').click();await page.locator('#geocodeSearch').fill('Bangkok');
  await page.waitForFunction(()=>document.querySelectorAll('.geocode-item').length>0||/ค้นหาไม่ได้|Search unavailable/.test(document.querySelector('#geocodeStatus').textContent),null,{timeout:15000});
  if(await page.locator('.geocode-item').count()){
   await page.locator('.geocode-item').first().click();await page.locator('.leaflet-popup-content').waitFor();
  }
  await page.locator('#geocodeSearch').press('Escape');
 }
 await page.locator('#place').selectOption('TH50');
 await page.waitForFunction(()=>/Chiang Mai|เชียงใหม่/.test(document.querySelector('#selectionName').textContent));
 await clickControl(page,'.advanced-tools>summary');
 await clickControl(page,'.lenses [data-tab=project]');
 await page.locator('#example').click();
 await page.locator('#boundaryInfo').waitFor({state:'visible'});
 await clickControl(page,'.advanced-tools>summary');
 await clickControl(page,'.lenses [data-tab=calculate]');
 await page.locator('[type=submit]').click();
 await page.waitForFunction(()=>/218\.86/.test(document.querySelector('#result').textContent));
 const download=page.waitForEvent('download');
 await page.locator('#exportJSON').click();
 const receipt=await download;
 assert.ok(receipt.suggestedFilename().endsWith('.json'));
 const exported=JSON.parse(await readFile(await receipt.path(),'utf8'));
 assert.ok(Math.abs(exported.result?.net-218.86)<0.01,'export does not match the displayed example result');
 assert.equal(exported.status,'illustrative-unverified-estimate');assert.equal(exported.issuedCredits,null);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${lang}@${width}: national overflow`);
 await page.screenshot({path:`${out}/national-calculation-${lang}-${width}.png`});
 // Both static reading surfaces must contain the working anchors and author/diagram assets.
 for(const kind of ['guide','research']){
  await gotoRetry(page,`${base}/${kind}-${lang}.html`);
  const selector=kind==='guide'?'.manual-routes':'.research-intro';
  await page.locator(selector).waitFor();
  const broken=await page.locator('a[href^="#"]').evaluateAll(links=>links.map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(decodeURIComponent(h.slice(1)))));
  assert.deepEqual(broken,[],`${kind}-${lang}: broken local anchors`);
  if(kind==='research'){
   const portrait=page.locator('.author-photo');
   await portrait.evaluate(img=>img.decode());
   assert.ok(await portrait.evaluate(img=>img.naturalWidth>0),'research portrait missing');
   assert.ok(await page.locator('.sysmap,.research-diagram').count()>0,'research diagrams missing');
  }else assert.ok(await page.locator('.screen-guide').count()>0,'guide screen diagram missing');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${kind}-${lang}@${width}: overflow`);
  await page.screenshot({path:`${out}/${kind}-${lang}-${width}.png`});
 }
}

// The version receipt must name the commit that was deployed.
const version=JSON.parse(await readFile(new URL('../public/version.json',import.meta.url),'utf8'));
const live=await (await fetch(`${base}/version.json`)).json();
assert.equal(live.commit,version.commit,`the live site serves ${live.commit}, the local build is ${version.commit} — if the local build is stale, run npm run build before verifying`);
assert.ok(live.builtAt, 'the live receipt must carry a build time');

assert.deepEqual(errors,[],'page errors on the live site');
await browser.close();
console.log(`PASS live ${base}: commit ${live.commit}, both languages, both widths, all four regional views under one name each, the comparison periods, the ozone correction, national calculation/export, bilingual guides and research.`);
