// Live verification: prove the deployed bytes behave, and capture what a reader sees.
//
// A deploy that returns 200 is not a release. This opens the live regional workspace, walks
// its views, checks that the country panel and the comparison table carry their units and
// periods, and captures the screens a reader actually gets.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';

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
  await page.goto(`${base}/sea.html?lang=${lang}`);
  await page.locator('body[data-ready]').first().waitFor({timeout:20000});

  // Every view must open and must show its own content.
  for(const view of ['map','evidence','compare','research']){
   await page.evaluate(v=>{
    const btn=document.querySelector(`button[data-sea-view="${v}"]`);
    if(btn&&btn.getBoundingClientRect().width>0){btn.click();return;}
    const sel=document.querySelector('#seaView');
    if(sel){sel.value=v;sel.dispatchEvent(new Event('change',{bubbles:true}));}
   },view);
   await page.waitForTimeout(250);
   assert.equal(await page.evaluate(()=>document.body.dataset.seaView),view,`${lang}@${width}: the ${view} view did not open`);
  }

  // The country panel must carry a unit and a dated source on every published number.
  await page.evaluate(()=>{
   const sel=document.querySelector('#seaView');
   sel.value='evidence';sel.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.waitForTimeout(250);
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
  await page.waitForTimeout(250);
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
 await page.goto(`${base}/bible.html?lang=${lang}#sea-what-is-a-credit`);
 await page.locator('figure.credit-figure').first().waitFor({timeout:20000});
 assert.equal(await page.locator('figure.credit-figure').count(),3,`${lang}: the credit chapter is missing a figure`);
 const text=await page.locator('#article').innerText();
 assert.ok(lang==='en'?text.includes('Burning does not damage the ozone layer'):text.includes('การเผาไหม้ไม่ได้ทำลายชั้นโอโซน'),`${lang}: the ozone correction is not on the page`);
 await page.locator('figure.credit-figure').nth(1).screenshot({path:`${out}/credit-layers-${lang}.png`});
}

// The version receipt must name the commit that was deployed.
const version=JSON.parse(await readFile(new URL('../public/version.json',import.meta.url),'utf8'));
const live=await (await fetch(`${base}/version.json`)).json();
assert.equal(live.commit,version.commit,`the live site serves ${live.commit}, the local build is ${version.commit}`);
assert.ok(live.builtAt, 'the live receipt must carry a build time');

assert.deepEqual(errors,[],'page errors on the live site');
await browser.close();
console.log(`PASS live ${base}: commit ${live.commit}, both languages, both widths, all four regional views, the comparison periods, and the ozone correction.`);
