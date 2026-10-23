#!/usr/bin/env node
// Captures the credit figures so they can be LOOKED at, not only measured.
//
// The credit-figure test measures labels against their boxes. It found a Thai label spilling
// seven pixels out of its panel, but a number is not a picture: the repair has to keep the
// diagram readable, and only a rendering can show whether it did.
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {measurementTarget} from './lib/local-server.mjs';

const target = await measurementTarget();
await mkdir('test-results/figures', {recursive: true});
const browser = await chromium.launch();
const page = await browser.newPage();

const shots = [
  ['sea-what-is-a-credit', 'th'],
  ['sea-what-is-a-credit', 'en'],
  ['sea-borders', 'th'],
  ['sea-borders', 'en'],
];

for (const [id, lang] of shots) {
  await page.setViewportSize({width: 2200, height: 1400});
  await page.goto(`${target.base}/bible.html?lang=${lang}#${id}`, {waitUntil: 'domcontentloaded'});
  await page.locator('.prose').waitFor();
  await page.evaluate(() => document.fonts.ready);
  const figs = page.locator('.credit-figure svg');
  const n = await figs.count();
  for (let i = 0; i < n; i++) {
    const fig = figs.nth(i);
    // The diagram lives in a horizontal scroller, so a screenshot of the element shows only
    // the slice the reader has scrolled to. For inspection, release the clip and let the
    // whole drawing render at its natural size.
    await fig.evaluate(el=>{
      const box=el.closest('.credit-diagram-scroll')||el.parentElement;
      if(box){box.style.overflow='visible';box.style.width='auto';}
      el.style.width='600px';el.style.height='auto';
    });
    await fig.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const name = `test-results/figures/${id}-${lang}-${i}.png`;
    await fig.screenshot({path: name});
    console.log(name);
  }
}

await browser.close();
await target.stop();
