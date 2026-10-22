// Proof that the deep spatial audit can fail.
//
// A checker that reports "clean" the first time it runs may simply be broken — measuring nothing
// looks exactly like measuring a perfect layout. This injects known defects into a live page and
// asserts the collector reports each one. If a defect class is missed, the audit's silence means
// nothing.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {collectSpatial} from './lib/spatial-collector.mjs';
import {collectLaw,chromeCost} from './lib/msh-law.mjs';

const base=process.env.BASE_URL||'http://127.0.0.1:8801';
const browser=await chromium.launch();
const page=await browser.newPage();
await page.setViewportSize({width:1280,height:900});
await page.goto(`${base}/bible.html?lang=en#sea-overview`,{waitUntil:'domcontentloaded'});
await page.locator('.prose').waitFor();

const collect=()=>page.evaluate(`(${collectSpatial.toString()})()`);
// The law's classes run through their own collector, which is a different instrument from the
// geometric one. A detector that is never exercised is a detector that has never been trusted.
const law=()=>page.evaluate(`(${collectLaw.toString()})()`);

// --- 1. row-leftover: a short item beside a much taller sibling in a grid row.
await page.evaluate(()=>{
 const d=document.createElement('div');
 d.id='synthetic-row';
 d.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:12px;width:600px';
 d.innerHTML='<div style="height:300px;background:#eee">tall</div><div style="height:40px;background:#ddd">short</div>';
 document.body.prepend(d);
});
let found=await collect();
assert.ok(found.some(o=>o.kind==='row-leftover'),`row-leftover must be detected, got ${JSON.stringify(found)}`);
await page.evaluate(()=>document.querySelector('#synthetic-row').remove());

// --- 2. gap-outlier: one gap far larger than its neighbours in the same container.
await page.evaluate(()=>{
 const d=document.createElement('div');
 d.id='synthetic-gap';
 d.style.cssText='display:block;width:400px';
 d.innerHTML='<p style="margin:0">a</p><p style="margin:0">b</p><p style="margin:0 0 200px 0">c</p><p style="margin:0">d</p><p style="margin:0">e</p>';
 document.body.prepend(d);
});
found=await collect();
assert.ok(found.some(o=>o.kind==='gap-outlier'),`gap-outlier must be detected, got ${JSON.stringify(found)}`);
await page.evaluate(()=>document.querySelector('#synthetic-gap').remove());

// --- 3. accidental-wrap: a control strip that breaks onto two lines.
await page.evaluate(()=>{
 const d=document.createElement('nav');
 d.id='synthetic-wrap';
 d.style.cssText='display:flex;flex-wrap:wrap;width:200px';
 d.innerHTML='<button style="width:100px">a</button><button style="width:100px">b</button><button style="width:100px">c</button>';
 document.body.prepend(d);
});
found=await collect();
assert.ok(found.some(o=>o.kind==='accidental-wrap'),`accidental-wrap must be detected, got ${JSON.stringify(found)}`);
await page.evaluate(()=>document.querySelector('#synthetic-wrap').remove());

// --- 4. empty-track: a grid column reserved and never occupied.
await page.evaluate(()=>{
 const d=document.createElement('div');
 d.id='synthetic-track';
 d.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:12px;width:600px';
 d.innerHTML='<div style="height:60px;background:#eee">only-left</div>';
 document.body.prepend(d);
});
found=await collect();
assert.ok(found.some(o=>o.kind==='empty-track'),`empty-track must be detected, got ${JSON.stringify(found)}`);
await page.evaluate(()=>document.querySelector('#synthetic-track').remove());

// --- 5. A dropdown menu is vertical on purpose and must NOT be reported as scattered actions.
// The map-tools panel is a correct menu: four items in one aligned column. The first version of
// rule D counted the summary and the four items together and called the result "scattered", which
// condemns a correct layout. A menu has to be exempt, and a genuine scattered toolbar has to
// still be caught.
await page.evaluate(()=>{
 const d=document.createElement('details');
 d.id='synthetic-menu';
 d.open=true;
 d.style.cssText='position:relative;width:240px';
 d.innerHTML='<summary style="height:44px">tools</summary><div style="position:absolute;top:44px;left:0;width:240px;display:grid">'
  +'<button style="height:40px">one</button><button style="height:40px">two</button><button style="height:40px">three</button></div>';
 document.body.prepend(d);
 const strip=document.createElement('div');
 strip.id='synthetic-strip';
 strip.className='quick-tools';
 strip.style.cssText='display:flex;gap:8px;width:600px;align-items:center';
 strip.innerHTML='<button style="height:44px">alpha</button><details id="synthetic-menu-2"><summary style="height:44px">beta</summary></details>';
 document.body.prepend(strip);
});
found=await collect();
assert.ok(!found.some(o=>o.kind==='scattered-actions'&&o.el.includes('synthetic-menu')),`a vertical menu must not be reported as scattered actions, got ${JSON.stringify(found)}`);
assert.ok(!found.some(o=>o.kind==='scattered-actions'&&o.el.includes('synthetic-strip')),`a strip whose trigger is on the header line must not be reported, got ${JSON.stringify(found)}`);
await page.evaluate(()=>{document.querySelector('#synthetic-menu')?.remove();document.querySelector('#synthetic-strip')?.remove();});

// --- 6. A genuinely scattered toolbar must still be caught, so the menu exemption did not
// simply switch the rule off.
await page.evaluate(()=>{
 const d=document.createElement('div');
 d.id='synthetic-scattered';
 d.className='chart-controls';
 d.style.cssText='display:flex;flex-wrap:wrap;width:260px;gap:6px';
 d.innerHTML='<button style="width:120px;height:40px">a</button><button style="width:120px;height:40px">b</button><button style="width:120px;height:40px">c</button>';
 document.body.prepend(d);
});
found=await collect();
assert.ok(found.some(o=>o.kind==='scattered-actions'),`a scattered toolbar must still be detected, got ${JSON.stringify(found)}`);
await page.evaluate(()=>document.querySelector('#synthetic-scattered')?.remove());

// --- 7. The clean page must still be clean, so the detectors are not simply always-firing.
found=await collect();
assert.equal(found.length,0,`the clean page must measure clean, got ${JSON.stringify(found)}`);

// --- 8. Scoped measurement must see a defect inside the scope and ignore one outside it.
await page.evaluate(()=>{
 const s=document.createElement('section');s.id='synthetic-scope';
 s.style.cssText='display:block;width:400px';
 s.innerHTML='<p style="margin:0">a</p><p style="margin:0">b</p><p style="margin:0 0 200px 0">c</p><p style="margin:0">d</p><p style="margin:0">e</p>';
 document.body.prepend(s);
});
const scoped=await page.evaluate(`(${collectSpatial.toString()})(document.querySelector('#synthetic-scope'))`);
assert.ok(scoped.some(o=>o.kind==='gap-outlier'),'a scoped measurement must find the defect inside its scope');
const scopedClean=await page.evaluate(`(${collectSpatial.toString()})(document.querySelector('.prose'))`);
assert.ok(!scopedClean.some(o=>o.kind==='gap-outlier'),'a scoped measurement must not invent a defect');

// --- 9. The law's own classes must be able to fail too.
//
// The geometric collector above proves the geometry rules work. These prove the OTHER half of
// the law — the chrome and symptom classes — actually detect anything. A law instrument that
// reports clean on every page is indistinguishable from a law instrument that measures nothing.
//
// Each defect is injected into the live page, and the detector must report it.
const clean=await law();
assert.deepEqual(clean,[],`the clean page must measure clean under the law, got ${JSON.stringify(clean)}`);

// --- 9a. overlapping-chrome: a fixed band that TRAPS the work.
//
// The fixture has to reproduce the real defect, not a looser one. The map's attribution was
// trapped because the map clips its own overflow and the phone layout clips the page, so nothing
// could scroll it into view. A band over content that merely scrolls past is ordinary sticky
// behaviour, and the rule deliberately does not report that.
await page.evaluate(()=>{
 const box=document.createElement('div');
 box.style.cssText='position:fixed;left:20px;top:300px;width:220px;height:40px;overflow:hidden;z-index:1';
 const work=document.createElement('p');
 work.id='synthetic-work';
 work.textContent='work that the band traps';
 work.style.cssText='margin:0;width:220px;height:30px;background:#fff';
 box.append(work);
 document.body.append(box);
 const band=document.createElement('div');
 band.id='synthetic-band';
 band.style.cssText='position:fixed;left:0;top:290px;width:320px;height:60px;background:#000;z-index:99999';
 document.body.append(band);
});
let foundLaw=await law();
assert.ok(foundLaw.some(o=>o.kind==='overlapping-chrome'),`overlapping-chrome must be detected, got ${JSON.stringify(foundLaw)}`);
await page.evaluate(()=>{document.querySelector('#synthetic-work')?.closest('div')?.remove();document.querySelector('#synthetic-band')?.remove();});

// --- 9a-bis. A STICKY band over content that scrolls past is NOT a defect. A sticky header that
// content scrolls under is how every sticky header works, and reporting it would condemn a
// correct layout. FIXED furniture is the opposite: it never moves, so what it covers is covered
// in the reader's first view.
await page.evaluate(()=>{
 const work=document.createElement('p');
 work.id='synthetic-scrolls';
 work.textContent='content that scrolls past the band';
 work.style.cssText='position:absolute;left:20px;top:300px;width:220px;height:30px;margin:0;background:#fff';
 document.body.append(work);
 const band=document.createElement('div');
 band.id='synthetic-band-2';
 band.style.cssText='position:sticky;left:0;top:290px;width:320px;height:60px;background:#000;z-index:99999';
 document.body.append(band);
});
foundLaw=await law();
assert.ok(!foundLaw.some(o=>o.kind==='overlapping-chrome'&&o.note.includes('scrolls past')),
 `content that scrolls under a band is not a defect, got ${JSON.stringify(foundLaw)}`);
await page.evaluate(()=>{document.querySelector('#synthetic-scrolls')?.remove();document.querySelector('#synthetic-band-2')?.remove();});

// --- 9b. inflated-control: one control stretched far past its label and its neighbours.
await page.evaluate(()=>{
 const row=document.createElement('div');
 row.id='synthetic-inflated';
 row.style.cssText='display:flex;gap:8px;width:900px;align-items:center';
 row.innerHTML='<button style="width:40px;height:40px">a</button><button style="width:700px;height:40px">b</button>';
 document.body.prepend(row);
});
foundLaw=await law();
assert.ok(foundLaw.some(o=>o.kind==='inflated-control'),`inflated-control must be detected, got ${JSON.stringify(foundLaw)}`);
await page.evaluate(()=>document.querySelector('#synthetic-inflated')?.remove());

// --- 9c. empty-hero: a region with real height and no content at all.
await page.evaluate(()=>{
 const s=document.createElement('section');
 s.id='synthetic-empty';
 s.style.cssText='width:400px;height:200px;background:#eee';
 document.body.prepend(s);
});
foundLaw=await law();
assert.ok(foundLaw.some(o=>o.kind==='empty-hero'),`empty-hero must be detected, got ${JSON.stringify(foundLaw)}`);
await page.evaluate(()=>document.querySelector('#synthetic-empty')?.remove());

// --- 9d. equal-weight: three identical blocks with the same heading size.
await page.evaluate(()=>{
 const g=document.createElement('div');
 g.id='synthetic-equal';
 g.style.cssText='display:grid;grid-template-columns:repeat(3,220px);gap:10px;width:700px';
 g.innerHTML=[1,2,3].map(i=>`<div style="height:120px;background:#eee"><h3>same ${i}</h3><p>body text</p></div>`).join('');
 document.body.prepend(g);
});
foundLaw=await law();
assert.ok(foundLaw.some(o=>o.kind==='equal-weight'),`equal-weight must be detected, got ${JSON.stringify(foundLaw)}`);
await page.evaluate(()=>document.querySelector('#synthetic-equal')?.remove());

// --- 9e. giant-top-bar: chrome that takes more than a quarter of the screen.
await page.evaluate(()=>{
 const bar=document.createElement('div');
 bar.id='synthetic-bar';
 bar.style.cssText='position:fixed;left:0;right:0;top:0;height:400px;background:#fff;border-bottom:2px solid #000;z-index:900';
 document.body.append(bar);
});
foundLaw=await law();
assert.ok(foundLaw.some(o=>o.kind==='giant-top-bar'),`giant-top-bar must be detected, got ${JSON.stringify(foundLaw)}`);
const cost=await page.evaluate(`(${chromeCost.toString()})(document)`);
assert.ok(cost.totalPct>25,`the chrome cost of a 400px bar on a 900px screen must exceed the limit, got ${cost.totalPct}%`);
await page.evaluate(()=>document.querySelector('#synthetic-bar')?.remove());

// --- 9f. And the page must be clean again once the defects are gone.
foundLaw=await law();
assert.deepEqual(foundLaw,[],`the page must measure clean once the defects are removed, got ${JSON.stringify(foundLaw)}`);

await browser.close();
console.log('PASS spatial detector self-test: row-leftover, gap-outlier, accidental-wrap, empty-track and scoped measurement are all detected; a scattered toolbar is caught; a vertical dropdown menu is not; the law classes catch overlapping chrome, inflated controls, empty spacers, equal-weight blocks and a giant top bar; the clean page measures clean.');