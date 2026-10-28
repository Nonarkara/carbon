// Live verification: prove the deployed bytes behave, and capture what a reader sees.
//
// A deploy that returns 200 is not a release. This opens the live site and proves that every
// surface it publishes actually works: the Thailand workbench, the regional workspace, the
// Bible, both research notebooks, both guides, and the page a reader reaches when a link is
// wrong. Each surface is opened in both languages at a phone and a desktop width, and each is
// checked for the content only that surface has — so a gate that lands on the wrong page
// cannot pass.
//
// Every wait here is for the thing the next assertion reads. A fixed pause is a guess about
// the network; against a cold edge a guess is how a verification fails a site that is fine.
// And a wait for an element the page ships with a placeholder in it is not a wait at all: the
// workbench's headline figure is "—" until the grid arrives, so the gate waits for the
// figure, not for the box that holds it.
//
// The assertions live in scripts/lib/live-surfaces.mjs, shared with the falsifier that proves
// each of them can fail.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {gotoRetry} from './lib/browser-nav.mjs';
import {SURFACES,assertNoSidewaysScroll,openSurface,NAV} from './lib/live-surfaces.mjs';

const base=process.argv[2]||'https://carbon.nonarkara.org';
const out='test-results/live';
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const page=await browser.newPage({acceptDownloads:true});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));

// Every published surface, in both languages, at a phone, a tablet and a desktop width.
// Three widths, not two: the law measures 390, 1024 and 1440, and a reader on a 1024px screen
// is a reader, not an edge case between two measurements.
const receipt={base,commit:null,at:new Date().toISOString(),surfaces:[]};
for(const lang of ['th','en']){
 for(const [width,height] of [[390,844],[1024,768],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const surface of SURFACES){
   await openSurface(page,base,surface,lang);
   await surface.prove(page,lang,width);
   await assertNoSidewaysScroll(page,lang,width,surface.name);
   const shot=`${out}/${surface.name.replace(/\s+/g,'-')}-${lang}-${width}.png`;
   await page.screenshot({path:shot,fullPage:false});
   receipt.surfaces.push({name:surface.name,lang,width,shot});
   console.log(`  ok  ${lang}@${width}  ${surface.name}`);
  }
  await gotoRetry(page,`${base}/sea.html?lang=${lang}`,NAV);
  await page.locator('body[data-ready]').first().waitFor({timeout:60000});
  await page.evaluate(()=>{const sel=document.querySelector('#seaView');sel.value='compare';sel.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.waitForFunction(()=>document.querySelectorAll('#countryRows tr').length===11,null,{timeout:30000});
  await page.screenshot({path:`${out}/sea-compare-${lang}-${width}.png`,fullPage:false});
 }
}

// The credit chapter with the new atmospheric-layers figure.
for(const lang of ['th','en']){
 await page.setViewportSize({width:1440,height:900});
 await gotoRetry(page,`${base}/bible.html?lang=${lang}#sea-what-is-a-credit`,NAV);
 await page.locator('figure.credit-figure').first().waitFor({timeout:30000});
 assert.equal(await page.locator('figure.credit-figure').count(),3,`${lang}: the credit chapter is missing a figure`);
 const text=await page.locator('#article').innerText();
 assert.ok(lang==='en'?text.includes('Burning does not damage the ozone layer'):text.includes('การเผาไหม้ไม่ได้ทำลายชั้นโอโซน'),`${lang}: the ozone correction is not on the page`);
 await page.locator('figure.credit-figure').nth(1).screenshot({path:`${out}/credit-layers-${lang}.png`});
}

// A wrong link must reach the house page, not a raw server error.
const missing=await page.goto(`${base}/no-such-page-for-verification`,{waitUntil:'domcontentloaded'});
assert.equal(missing.status(),404,'a wrong link does not answer 404');
const notFound=(await page.locator('h1').first().innerText()).trim();
assert.ok(notFound.includes('ไม่พบหน้า')||notFound.includes('Page not found'),`the 404 page says "${notFound}"`);

// The version receipt must name the commit that was deployed.
const version=JSON.parse(await readFile(new URL('../public/version.json',import.meta.url),'utf8'));
const live=await (await fetch(`${base}/version.json`)).json();
assert.equal(live.commit,version.commit,`the live site serves ${live.commit}, the local build is ${version.commit} — if the local build is stale, run npm run build before verifying`);
assert.ok(live.builtAt, 'the live receipt must carry a build time');
receipt.commit=live.commit;
receipt.builtAt=live.builtAt;

assert.deepEqual(errors,[],'page errors on the live site');
await browser.close();
await writeFile(`${out}/live-report.json`,JSON.stringify(receipt,null,2));
console.log(`PASS live ${base}: commit ${live.commit}, ${SURFACES.length} published surfaces in both languages at 390, 1024 and 1440, the 404 page, the comparison periods, and the ozone correction. Evidence: ${out}/live-report.json and ${out}/*.png`);
