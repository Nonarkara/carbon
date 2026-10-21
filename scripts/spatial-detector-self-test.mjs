// Proof that the deep spatial audit can fail.
//
// A checker that reports "clean" the first time it runs may simply be broken — measuring nothing
// looks exactly like measuring a perfect layout. This injects known defects into a live page and
// asserts the collector reports each one. If a defect class is missed, the audit's silence means
// nothing.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {collectSpatial} from './lib/spatial-collector.mjs';

const base=process.env.BASE_URL||'http://127.0.0.1:8801';
const browser=await chromium.launch();
const page=await browser.newPage();
await page.setViewportSize({width:1280,height:900});
await page.goto(`${base}/bible.html?lang=en#sea-overview`,{waitUntil:'domcontentloaded'});
await page.locator('.prose').waitFor();

const collect=()=>page.evaluate(`(${collectSpatial.toString()})()`);

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

await browser.close();
console.log('PASS spatial detector self-test: row-leftover, gap-outlier, accidental-wrap, empty-track and scoped measurement are all detected; a scattered toolbar is caught; a vertical dropdown menu is not; the clean page measures clean.');
