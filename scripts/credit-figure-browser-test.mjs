// The credit-teaching figures must render, not merely exist.
//
// The first version of this work drew a diagram, generated it into public/js/, and put the key in
// the chapter map. It never checked that a reader could see it: a missing figure, a zero-height
// SVG or a diagram whose text runs past the canvas all look fine in code review. This exercises
// what a reader actually gets.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {measurementTarget} from './lib/local-server.mjs';
import {gotoRetry} from './lib/browser-nav.mjs';

const base=(await measurementTarget()).base;
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
   await gotoRetry(page, `${base}/bible.html?lang=${lang}#${id}`);
   await page.locator('.prose').waitFor();
   // The credit figures live INSIDE the chapter body, beside the paragraph each one explains.
   // They used to sit in a .figure-stack block at the top of the article; that class no longer
   // exists for these chapters, and a test that still looks for it would wait forever.
   await page.locator('figure.credit-figure').first().waitFor();
   // The measurement below is a TEXT measurement, and text metrics belong to the font that is
   // actually applied when the measurement is taken. This test used to measure while the Thai
   // webfont was still loading, so it measured whatever fallback the machine had: the same
   // commit passed in one place and failed in another by a single pixel, and CI was red for a
   // diagram that was fine on the developer's laptop. Wait for the font, and the measurement
   // is the same everywhere.
   await page.evaluate(()=>document.fonts.ready);

   // Every figure the chapter promises is actually on the page, with a rendered box.
   const figs=page.locator('figure.credit-figure');
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

   // THE LAW: "Explanations stay with the decision they support."
   //
   // These figures used to be stacked in one block at the top of the article, which put 2,000 to
   // 3,500 pixels of diagram between a beginner and the chapter's first sentence, and left each
   // figure far away from the paragraph it explains. This asserts the repair holds: every figure
   // must sit immediately after the paragraph it explains, with no other content between them.
   const adjacency=await page.evaluate(()=>{
    const prose=document.querySelector('.prose');
    const out=[];
    for(const f of prose.querySelectorAll('figure.credit-figure')){
     const prev=f.previousElementSibling;
     const gap=prev?Math.round(f.getBoundingClientRect().top-prev.getBoundingClientRect().bottom):null;
     out.push({
      prevTag:prev?prev.tagName.toLowerCase():null,
      prevChars:prev?prev.textContent.trim().length:0,
      gap,
      caption:(f.querySelector('figcaption')?.textContent||'').trim().slice(0,40),
     });
    }
    // The chapter's own first paragraph must come BEFORE any diagram, or the reader still meets
    // a wall of picture before a word of prose.
    const kids=[...prose.children];
    const firstPara=kids.findIndex(k=>k.tagName==='P');
    const firstFig=kids.findIndex(k=>k.matches('figure.credit-figure'));
    return {figures:out,firstPara,firstFig,totalKids:kids.length};
   });
   assert.ok(adjacency.figures.length===count,`${id}/${lang}@${width}: expected ${count} figures, found ${adjacency.figures.length}`);
   for(const [i,f] of adjacency.figures.entries()){
    assert.equal(f.prevTag,'p',`${id}/${lang}@${width}: figure ${i} is not directly after a paragraph (it follows ${f.prevTag||'nothing'})`);
    // The explanation must be a real paragraph, not a stub. The measure is CHARACTERS, not
    // words: Thai does not separate words with spaces, so the same paragraph counts as 5 "words"
    // in Thai and 22 in English. The shortest genuine paragraph in these chapters is 100
    // characters, and a heading or a fragment is far shorter than that.
    assert.ok(f.prevChars>=80,`${id}/${lang}@${width}: figure ${i} follows a fragment, not an explanation (${f.prevChars} chars)`);
    assert.ok(f.gap!==null&&f.gap>=0&&f.gap<=48,`${id}/${lang}@${width}: figure ${i} is ${f.gap}px from the paragraph it explains`);
   }
   if(adjacency.firstFig>=0){
    assert.ok(adjacency.firstPara>=0&&adjacency.firstPara<adjacency.firstFig,
     `${id}/${lang}@${width}: the chapter's first paragraph (index ${adjacency.firstPara}) must come before the first figure (index ${adjacency.firstFig})`);
   }
   // And the prose must actually start near the top of the chapter, not thousands of pixels down.
   const lead=await page.evaluate(()=>{
    const prose=document.querySelector('.prose');
    const p=prose.querySelector('p');
    return p?Math.round(p.getBoundingClientRect().top+scrollY):null;
   });
   assert.ok(lead!==null&&lead<1600,`${id}/${lang}@${width}: the first paragraph sits ${lead}px down the page — the reader meets diagram before prose`);

   // Two labels in one diagram must never overprint. The border-ledger figure once printed
   // "Vietnam" and a note line on top of each other, and no amount of reading the code saw it:
   // the note's baseline sat inside the fourth row's band. Only a renderer can catch this.
   const overprints=await page.evaluate(()=>{
    const out=[];
    for(const svg of document.querySelectorAll('.credit-figure svg')){
     const texts=[...svg.querySelectorAll('text')].map(t=>{const b=t.getBBox();return {t:t.textContent.trim().slice(0,30),x:b.x,y:b.y,w:b.width,h:b.height};});
     for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
      const a=texts[i],b=texts[j];
      const ox=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x);
      const oy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
      // A couple of pixels is a font metric — a descender box meeting the next line's ascender
      // box — not a collision. A real overprint shares a readable amount of both.
      if(ox>4&&oy>4)out.push({a:a.t,b:b.t,overlap:`${Math.round(ox)}x${Math.round(oy)}`});
     }
    }
    return out;
   });
   assert.deepEqual(overprints,[],`${id}/${lang}@${width}: labels overprint inside a diagram: ${JSON.stringify(overprints)}`);

   // A label must also fit inside the box it belongs to. A note that runs under a status box, or
   // out past the panel it sits in, is unreadable even when two labels do not technically touch.
   // A label that begins OUTSIDE every box is a caption for the box beneath it and is allowed to
   // sit above it — that is how a table header works.
   //
   // The rule is a label may not SPILL out of its panel, with a small margin kept in hand. The
   // old tolerance of eight pixels let a Thai label sit seven pixels outside its panel: it
   // passed the test and looked wrong on the page. The margin is reported in the failure so a
   // label that is merely close can be seen before it becomes a spill.
   const MARGIN=2;
   const escapes=await page.evaluate(margin=>{
    const out=[];
    for(const svg of document.querySelectorAll('.credit-figure svg')){
     const boxes=[...svg.querySelectorAll('rect')].map(r=>({x:+r.getAttribute('x'),y:+r.getAttribute('y'),w:+r.getAttribute('width'),h:+r.getAttribute('height')}));
     for(const t of svg.querySelectorAll('text')){
      const b=t.getBBox();
      const home=boxes.find(p=>b.x>=p.x-2&&b.y>=p.y-2&&b.x<=p.x+p.w+2&&b.y<=p.y+p.h+2);
      if(!home)continue;
      const slack=Math.round(Math.min(home.x+home.w-(b.x+b.width),home.y+home.h-(b.y+b.height)));
      if(slack<margin){
       out.push({t:t.textContent.trim().slice(0,30),x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),box:`${home.x},${home.y} ${home.w}x${home.h}`,slack});
      }
     }
    }
    return out;
   },MARGIN);
   assert.deepEqual(escapes,[],`${id}/${lang}@${width}: a label does not fit its box: ${JSON.stringify(escapes)}`);
  }
 }
}

// The atmospheric-layers figure exists to correct one beginner misconception. That correction has
// to be readable on the page, not only present in the markup.
for(const [lang,phrase] of [['en','Burning does not damage the ozone layer'],['th','การเผาไหม้ไม่ได้ทำลายชั้นโอโซน']]){
 await page.setViewportSize({width:1440,height:900});
 await gotoRetry(page, `${base}/bible.html?lang=${lang}#sea-what-is-a-credit`);
 await page.locator('figure.credit-figure').first().waitFor();
 const text=await page.locator('#article').innerText();
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
