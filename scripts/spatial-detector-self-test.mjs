// Proof that the deep spatial audit can fail.
//
// A checker that reports "clean" the first time it runs may simply be broken — measuring nothing
// looks exactly like measuring a perfect layout. This injects known defects into a live page and
// asserts the collector reports each one. If a defect class is missed, the audit's silence means
// nothing.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {collectSpatial} from './lib/spatial-collector.mjs';
import {collectLaw,chromeCost,EQUAL_WEIGHT_EXEMPTIONS} from './lib/msh-law.mjs';
import {measurementTarget} from './lib/local-server.mjs';

// Start this project's own server when the caller has not named one, so the falsifier is
// runnable as a single command and can never measure a stranger's app on a shared port.
const target=await measurementTarget();
const base=target.base;
const browser=await chromium.launch();
const page=await browser.newPage();
await page.setViewportSize({width:1280,height:900});
await page.goto(`${base}/bible.html?lang=en#sea-overview`,{waitUntil:'domcontentloaded'});
await page.locator('.prose').waitFor();

const collect=()=>page.evaluate(`(${collectSpatial.toString()})()`);
// The law's classes run through their own collector, which is a different instrument from the
// geometric one. A detector that is never exercised is a detector that has never been trusted.
const law=()=>page.evaluate(`(${collectLaw.toString()})(null,${JSON.stringify(EQUAL_WEIGHT_EXEMPTIONS)})`);

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

// --- 9d-bis. equal-weight must also SEE a peer row whose label is bold rather than a heading.
//
// This is the class the rule used to be blind to. The research page's six pose cards carry a
// <b> label, not an <h3>, so the old rule skipped the row by construction — and an audit that
// cannot see a peer row can neither condemn it nor excuse it. The six pose cards are now
// examined and exempted BY NAME, but only because the rule can see them.
await page.evaluate(()=>{
 const g=document.createElement('div');
 g.id='synthetic-equal-bold';
 g.style.cssText='display:grid;grid-template-columns:repeat(3,220px);gap:10px;width:700px';
 g.innerHTML=[1,2,3].map(i=>`<div style="height:120px;background:#eee"><b>label ${i}</b><span>body text</span></div>`).join('');
 document.body.prepend(g);
});
foundLaw=await law();
assert.ok(foundLaw.some(o=>o.kind==='equal-weight'&&o.el.includes('synthetic-equal-bold')),
 `a peer row labelled with <b> must be detected, got ${JSON.stringify(foundLaw)}`);
await page.evaluate(()=>document.querySelector('#synthetic-equal-bold')?.remove());

// --- 9d-ter. The named exemption must hold for the pose list AND must be revocable.
//
// The pose cards are six peers of one thing, so they are exempt. But an exemption that cannot
// be revoked is a hole, not an exemption: if one card grows, the peer set is no longer even,
// and the rule must speak again. Both halves are proved here — on the real page, and on a
// mutated copy of it.
//
// The pose list lives on the research page, so this part of the falsifier goes there and comes
// back. It measures the real element, not a fixture that resembles it.
await page.goto(`${base}/research-en.html`,{waitUntil:'domcontentloaded'});
await page.locator('.kabonna-poses').waitFor();
const poseExemption=await page.evaluate(()=>{
 const ul=document.querySelector('.kabonna-poses');
 if(!ul)return {missing:true};
 const kids=[...ul.children];
 return {
  missing:false,
  count:kids.length,
  perRow:[...new Set(kids.map(k=>Math.round(k.getBoundingClientRect().top)))].length,
  heights:[...new Set(kids.map(k=>Math.round(k.getBoundingClientRect().height)))],
  labelSizes:[...new Set(kids.map(k=>Math.round(parseFloat(getComputedStyle(k.querySelector('b')).fontSize))))],
 };
});
assert.ok(!poseExemption.missing,'the pose list must exist on the page the falsifier measures');
assert.equal(poseExemption.count,6,'the pose list must hold the six poses the exemption names');
assert.equal(poseExemption.heights.length,1,'the six poses must be one even peer set');
assert.equal(poseExemption.labelSizes.length,1,'the six poses must carry one label size');
foundLaw=await law();
assert.ok(!foundLaw.some(o=>o.kind==='equal-weight'&&o.el.includes('kabonna-poses')),
 `the exempted pose list must not be reported, got ${JSON.stringify(foundLaw.filter(o=>o.el.includes('kabonna-poses')))}`);

// Revoke it: make one card taller and the peer set is no longer even.
await page.evaluate(()=>{
 const ul=document.querySelector('.kabonna-poses');
 ul.dataset.savedHeight=ul.children[0].style.height;
 ul.children[0].style.height='+260px';
});
foundLaw=await law();
assert.ok(foundLaw.some(o=>o.kind==='equal-weight'&&o.el.includes('kabonna-poses')),
 `the exemption must be revocable: a pose card that grows must be reported, got ${JSON.stringify(foundLaw.filter(o=>o.el.includes('kabonna-poses')))}`);
await page.evaluate(()=>{
 const ul=document.querySelector('.kabonna-poses');
 if(ul&&ul.dataset.savedHeight!==undefined)ul.children[0].style.height=ul.dataset.savedHeight;
});
foundLaw=await law();
assert.ok(!foundLaw.some(o=>o.kind==='equal-weight'&&o.el.includes('kabonna-poses')),
 'the exemption must apply again once the pose list is even again');

// Back to the page the rest of the falsifier works on.
await page.goto(`${base}/bible.html?lang=en#sea-overview`,{waitUntil:'domcontentloaded'});
await page.locator('.prose').waitFor();

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

// --- 9g. unreachable-content: content cut off by a clip that cannot scroll.
//
// This is the defect the research page actually had: `td{min-width:125px}` guaranteed every
// table was wider than the phone's reading column, and the table's own `overflow:auto` hid
// the overflow in a second scroller. Thirty tables were cut at the column edge with the rest
// of the text unreachable.
//
// The fixture reproduces that shape: content that is wider than the box it sits in, inside a
// clip that cannot scroll. The detector must report it.
await page.evaluate(()=>{
 const box=document.createElement('div');
 box.id='synthetic-clip';
 // Fixed, not absolute: the page may already be scrolled, and a fixture parked at a document
 // coordinate can land outside the viewport — where content is simply not painted, which is a
 // different failure from content that is cut off.
 box.style.cssText='position:fixed;left:20px;top:300px;width:300px;overflow:hidden;background:#fff;z-index:1';
 const p=document.createElement('p');
 p.textContent='this paragraph is far wider than the box that clips it and can never be read';
 p.style.cssText='margin:0;width:900px;background:#eee';
 box.append(p);
 document.body.append(box);
});
foundLaw=await law();
assert.ok(foundLaw.some(o=>o.kind==='unreachable-content'),`unreachable-content must be detected, got ${JSON.stringify(foundLaw)}`);
await page.evaluate(()=>document.querySelector('#synthetic-clip')?.remove());

// --- 9h. The SAME content in a scrollable box is NOT a defect. A wide table that scrolls is
// a table that needs the room; the law allows a table to take the space it needs to be
// understood. Only content that is cut off AND unreachable is a failure, and conflating the
// two would condemn every scrollable table in the project.
await page.evaluate(()=>{
 const box=document.createElement('div');
 box.id='synthetic-scroller';
 box.style.cssText='position:fixed;left:20px;top:300px;width:300px;overflow-x:auto;background:#fff;z-index:1';
 const p=document.createElement('p');
 p.textContent='this paragraph is far wider than the box that holds it and the box can scroll';
 p.style.cssText='margin:0;width:900px;background:#eee';
 box.append(p);
 document.body.append(box);
});
foundLaw=await law();
assert.ok(!foundLaw.some(o=>o.kind==='unreachable-content'),`a scrollable wide block is not unreachable content, got ${JSON.stringify(foundLaw)}`);
await page.evaluate(()=>document.querySelector('#synthetic-scroller')?.remove());

// --- 9i. nested-scroll: the overflow moved into a scroller inside a scroller.
//
// This is the defect the research page really had. The page wrapped every table in a
// `.table-scroll` frame, and the table itself was `display:block;overflow:auto` as well, so
// the frame the reader could see never scrolled and the overflow lived in a second scroll
// area inside the table. Twenty-five of them, at 390px.
//
// The fixture reproduces that: a frame that cannot scroll, holding a scroller that can.
await page.evaluate(()=>{
 const frame=document.createElement('div');
 frame.id='synthetic-frame';
 frame.style.cssText='position:fixed;left:20px;top:300px;width:300px;overflow:auto;background:#fff;z-index:1';
 const inner=document.createElement('div');
 inner.id='synthetic-inner';
 // The inner scroller is the same width as its frame and holds content wider than itself —
 // so the INNER scrolls and the frame cannot, which is the shape the research page had.
 inner.style.cssText='width:100%;height:40px;overflow:auto;background:#eee';
 inner.innerHTML='<div style="width:900px">the overflow that lives in the wrong scroller</div>';
 frame.append(inner);
 document.body.append(frame);
});
foundLaw=await law();
assert.ok(foundLaw.some(o=>o.kind==='nested-scroll'),`nested-scroll must be detected, got ${JSON.stringify(foundLaw)}`);
await page.evaluate(()=>document.querySelector('#synthetic-frame')?.remove());

// --- 9j. A pair of scroll containers where NEITHER scrolls is not a defect. The SEA page has
// one: a workspace with an inner panel, both overflow:auto, both with nothing to scroll.
// Reporting that would be reporting a CSS detail the reader never meets.
await page.evaluate(()=>{
 const frame=document.createElement('div');
 frame.id='synthetic-inert-frame';
 frame.style.cssText='position:fixed;left:20px;top:300px;width:300px;overflow:auto;background:#fff;z-index:1';
 const inner=document.createElement('div');
 inner.id='synthetic-inert-inner';
 inner.style.cssText='width:200px;height:40px;overflow:auto;background:#eee';
 inner.textContent='nothing here overflows at all';
 frame.append(inner);
 document.body.append(frame);
});
foundLaw=await law();
assert.ok(!foundLaw.some(o=>o.kind==='nested-scroll'),`an inert pair of scroll containers is not a defect, got ${JSON.stringify(foundLaw)}`);
await page.evaluate(()=>document.querySelector('#synthetic-inert-frame')?.remove());

// --- 9k. A nested area that scrolls DOWNWARD is not a defect either. The Southeast Asia page
// has one: its evidence panel scrolls 462px inside the workspace frame, and that layout is
// correct — the workspace fills the viewport below the chrome and the page itself never
// scrolls, so the panel IS the reading surface. The defect is an area that overflows
// SIDEWAYS inside a document read from top to bottom.
await page.evaluate(()=>{
 const frame=document.createElement('div');
 frame.id='synthetic-vertical-frame';
 frame.style.cssText='position:fixed;left:20px;top:200px;width:300px;height:120px;overflow:auto;background:#fff;z-index:1';
 const inner=document.createElement('div');
 inner.id='synthetic-vertical-inner';
 inner.style.cssText='width:100%;height:100%;overflow:auto;background:#eee';
 inner.innerHTML='<div style="height:900px">the panel that is the reading surface</div>';
 frame.append(inner);
 document.body.append(frame);
});
foundLaw=await law();
assert.ok(!foundLaw.some(o=>o.kind==='nested-scroll'),`a nested area that scrolls downward is the reading surface, not a defect, got ${JSON.stringify(foundLaw)}`);
await page.evaluate(()=>document.querySelector('#synthetic-vertical-frame')?.remove());

// --- 9f. And the page must be clean again once the defects are gone.
foundLaw=await law();
assert.deepEqual(foundLaw,[],`the page must measure clean once the defects are removed, got ${JSON.stringify(foundLaw)}`);

await browser.close();
// The measurement is done. Release the server this gate started, so the port is free and
// nothing is left listening after the gate ends.
await target.stop();
console.log('PASS spatial detector self-test: row-leftover, gap-outlier, accidental-wrap, empty-track and scoped measurement are all detected; a scattered toolbar is caught; a vertical dropdown menu is not; the law classes catch overlapping chrome, inflated controls, empty spacers, equal-weight blocks (including a peer row labelled with bold rather than a heading), a giant top bar, content cut off with no way to scroll it into view, and overflow moved sideways into a nested scroll area; the named peer-set exemption holds for the six pose cards AND is revoked when one of them grows; a scrollable wide block, an inert pair of scroll containers and a nested panel that scrolls downward are not reported; the clean page measures clean.');