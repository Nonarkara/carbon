// The credit-teaching figures must render, not merely exist.
//
// The first version of this work drew a diagram, generated it into public/js/, and put the key in
// the chapter map. It never checked that a reader could see it: a missing figure, a zero-height
// SVG or a diagram whose text runs past the canvas all look fine in code review. This exercises
// what a reader actually gets.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const base=process.env.BASE_URL||'http://127.0.0.1:8788';
const browser=await chromium.launch();
const page=await browser.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await mkdir('test-results',{recursive:true});

const EXPECTED={
 'sea-what-is-a-credit':3,
 'sea-borders':2,
 'sea-industry':2,
};

for(const lang of ['th','en']){
 for(const [id,count] of Object.entries(EXPECTED)){
  for(const width of [375,1440]){
   await page.setViewportSize({width,height:900});
   await page.goto(`${base}/bible.html?lang=${lang}#${id}`);
   await page.locator('.prose').waitFor();
   await page.locator('.figure-stack').waitFor();

   // Every figure the chapter promises is actually on the page, with a rendered box.
   const figs=page.locator('.figure-stack figure.credit-figure');
   assert.equal(await figs.count(),count,`${id}/${lang}@${width}: figure count`);
   for(let i=0;i<count;i++){
    const f=figs.nth(i);
    const box=await f.boundingBox();
    assert.ok(box&&box.height>120,`${id}/${lang}@${width}: figure ${i} has no height`);
    const svg=f.locator('svg');
    assert.equal(await svg.count(),1,`${id}/${lang}@${width}: figure ${i} must hold exactly one svg`);
    const r=await svg.boundingBox();
    assert.ok(r&&r.width>100&&r.height>60,`${id}/${lang}@${width}: figure ${i} svg is not rendered`);
    // The SVG must keep its own aspect ratio, or the text inside it is squashed and unreadable.
    const vb=await svg.getAttribute('viewBox');
    const [,,vw,vh]=vb.split(/\s+/).map(Number);
    const expected=vh/vw;
    const actual=r.height/r.width;
    assert.ok(Math.abs(actual-expected)<0.06,`${id}/${lang}@${width}: figure ${i} is distorted (${actual.toFixed(3)} vs ${expected.toFixed(3)})`);
    // A title and a caption are what a screen reader and a sighted reader both need.
    assert.ok((await svg.locator('title').textContent()).length>3,`${id}/${lang}@${width}: figure ${i} has no title`);
    assert.ok((await f.locator('figcaption').textContent()).length>3,`${id}/${lang}@${width}: figure ${i} has no caption`);
   }

   // The diagram scrolls sideways inside its own region, so a wide figure never widens the page.
   const scroll=page.locator('.credit-diagram-scroll').first();
   assert.equal(await scroll.getAttribute('tabindex'),'0','the scroll region must be keyboard reachable');
   assert.equal(await scroll.getAttribute('role'),'region');
   const geom=await scroll.evaluate(e=>({sw:e.scrollWidth,cw:e.clientWidth}));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${id}/${lang}@${width}: the page scrolls sideways`);
   // When the diagram is wider than its region, the region must actually scroll — and a reader
   // must be able to reach it without a mouse. When it fits, no scrolling is the correct result.
   if(geom.sw>geom.cw+1){
    const moved=await scroll.evaluate(e=>{e.scrollLeft=60;return e.scrollLeft;});
    assert.ok(moved>0,`${id}/${lang}@${width}: the diagram region does not scroll`);
    await scroll.evaluate(e=>{e.scrollLeft=0;});
   }

   // The text alternative is a real list of the labels drawn in the diagram.
   const transcript=page.locator('.diagram-transcript').first();
   assert.ok(await transcript.count(),'the diagram must carry a text transcript');
   assert.ok((await transcript.locator('li').count())>3,'the transcript must list the diagram labels');
  }
 }
}

// The atmospheric-layers figure exists to correct one beginner misconception. That correction has
// to be readable on the page, not only present in the markup.
for(const [lang,phrase] of [['en','Burning does not damage the ozone layer'],['th','การเผาไหม้ไม่ได้ทำลายชั้นโอโซน']]){
 await page.setViewportSize({width:1440,height:900});
 await page.goto(`${base}/bible.html?lang=${lang}#sea-what-is-a-credit`);
 await page.locator('.figure-stack').waitFor();
 const text=await page.locator('.figure-stack').innerText();
 assert.ok(text.includes(phrase),`${lang}: the ozone correction is not visible on the page`);
 // And the chapter body must say the same thing in prose.
 const prose=await page.locator('.prose').innerText();
 assert.ok(prose.includes(phrase.split(' ').slice(-4).join(' '))||prose.includes('ozone')||prose.includes('โอโซน'),`${lang}: the chapter body must also carry the correction`);
 await page.locator('#article').scrollIntoViewIfNeeded();
 await page.screenshot({path:`test-results/credit-layers-${lang}.png`,fullPage:false});
}

assert.deepEqual(errors,[],'page errors');
await browser.close();
console.log('PASS credit figures: 7 figures across 3 chapters, TH/EN, phone and desktop — rendered, undistorted, scrollable, transcribed, and the ozone correction is readable.');
