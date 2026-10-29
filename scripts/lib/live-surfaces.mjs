// The published surfaces, and the fact that proves each one was reached.
//
// This table is the instrument behind two scripts: the live verification, which walks the
// deployed site, and the falsifier, which breaks each surface on purpose and proves the
// assertion fires. They share one copy of the assertions on purpose — a falsifier that
// tests a paraphrase of the check proves the paraphrase, not the gate.
//
// They also share one copy of the NAVIGATION, because the navigation is part of the check:
// how a surface is opened decides what the surface is measured against.
//
// Every assertion here reads something that only that surface has, so a check that lands on
// the wrong page cannot pass. Every wait is for the content the next assertion reads: the
// workbench ships its headline figure as a placeholder, and waiting for the box that holds
// the placeholder proves nothing.
//
// And the numbers a surface publishes are compared with the DATA the same site ships, not
// with a literal written into this file. The Bible says how many chapters it holds; the
// corpus it holds is fetched from the site being verified and the two must agree. A check
// that hardcoded 68 would have kept passing while the product grew underneath it, and would
// have started failing — falsely, with a message that looks like a broken site — the day
// somebody added a chapter. A gate that cannot tell the difference between "the product
// changed" and "the product broke" is a gate that will be turned off.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gotoRetry} from './browser-nav.mjs';
import {clickControl} from '../browser-controls.mjs';

/**
 * How a surface is opened.
 *
 * `domcontentloaded`, not `load`: the pages here fetch map tiles and fonts from third parties
 * the site does not control, and a navigation that waits for all of them times out on a slow
 * edge and reports a network condition as a defect in the site. The readiness of the page is
 * asserted by the surface's own `ready` selector and by waits for the content each assertion
 * reads — never by a fixed pause.
 */
export const NAV = {waitUntil: 'domcontentloaded', timeout: 60000};

/**
 * Open a surface the way the live verification opens it.
 *
 * `settle: false` opens the page WITHOUT waiting for the surface's own content to arrive.
 * That is only right for one caller: the falsifier, which arms a defect that prevents the
 * content from ever arriving and has to be able to open the page to arm it.
 *
 * @param {import('playwright').Page} page the page
 * @param {string} base the site to open
 * @param {object} surface one entry of SURFACES
 * @param {string} lang the language
 * @param {{settle?:boolean}} [options]
 */
export async function openSurface(page, base, surface, lang, {settle = true} = {}) {
  await gotoRetry(page, `${base}${surface.path(lang)}`, NAV);
  await page.locator(surface.ready).first().waitFor({timeout: 60000});
  if (settle && surface.settle) await surface.settle(page, lang);
}

/**
 * Fetch a data file from the same origin the page was opened from.
 *
 * The point of fetching it HERE, in the browser, rather than reading it off disk, is that the
 * comparison is between what the site PUBLISHES and what the site SHIPS — on the deployed
 * site, over the wire. A local file could be a different build.
 *
 * @param {import('playwright').Page} page the page
 * @param {string} path the path, relative to the site's root
 * @returns {Promise<any>} the parsed JSON
 */
export async function fetchJson(page, path) {
  return page.evaluate(async p => {
    const res = await fetch(p);
    if (!res.ok) throw new Error(`${p}: ${res.status}`);
    return res.json();
  }, path);
}

/**
 * Prove a surface, once more if the page was slow.
 *
 * A cold load can render later than the waits inside `prove` allow: a first page after a
 * deploy comes off a cold edge, and a machine busy with other work schedules a browser
 * late. That is a network or machine condition, not a defect of the site, and the rule this
 * project already follows is "a slow page is not a broken page".
 *
 * The retry is deliberately narrow:
 *
 *   - It fires only on a TIMEOUT. An assertion failure is the signal that a surface is
 *     wrong, and it is never retried, so a broken page cannot be retried into a passing one.
 *   - It fires once, so a page that is genuinely hung still fails — twice as slowly.
 *   - `prove` is IDEMPOTENT rather than read-only: it selects the same province, runs the
 *     same illustrative example and takes the same export, so running it twice checks the
 *     same thing twice.
 *
 * The live verification and the falsifier both come through here, so the falsifier proves
 * the code that actually ships rather than a variant of it.
 *
 * @param {import('playwright').Page} page the page
 * @param {object} surface one entry of SURFACES
 * @param {string} lang the language
 * @param {number} width the viewport width
 * @param {{attempts?:number, retryDelay?:number}} [options]
 */
export async function proveSurface(page, surface, lang, width, {attempts = 2, retryDelay = 800} = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await surface.prove(page, lang, width);
    } catch (err) {
      if (!err || err.name !== 'TimeoutError') throw err;
      lastError = err;
      if (attempt === attempts) break;
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  throw lastError;
}

/**
 * The page must not scroll sideways.
 *
 * A surface that is wider than the viewport is the oldest and most common way a layout
 * breaks on a phone: the reader has to pan a page that was supposed to be one column.
 *
 * @param {import('playwright').Page} page the page
 * @param {string} lang the language
 * @param {number} width the viewport width
 * @param {string} name the surface's name, for the message
 */
export async function assertNoSidewaysScroll(page, lang, width, name) {
  const sideways = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.ok(!sideways, `${lang}@${width}: ${name} scrolls sideways`);
}

export const SURFACES = [
  {
    name: 'the Thailand workbench',
    path: lang => `/?lang=${lang}`,
    ready: '#kStock',
    settle: async (page, lang, width, {timeout = 60000} = {}) => {
      // The headline figure ships as a placeholder and is replaced by the number the grid
      // produced. Waiting for the placeholder to exist proves nothing, so wait for the number.
      await page.waitForFunction(() => /\d/.test(document.querySelector('#kStock')?.textContent || ''), null, {timeout});
      await page.waitForFunction(() => /\d/.test(document.querySelector('#calculationTrace')?.textContent || ''), null, {timeout});
    },
    prove: async (page, lang, width) => {
      // The headline number and the calculation that produced it must be the same number.
      // A figure that drifts from its own trace is the failure this gate exists to catch.
      const stock = (await page.locator('#kStock').innerText()).trim();
      assert.match(stock, /^[\d.,]+\s*M$/, `${lang}@${width}: the national figure reads "${stock}", which is not a magnitude`);
      const trace = (await page.locator('#calculationTrace').innerText()).trim();
      const fromTrace = trace.match(/([\d.,]+)\s*tCO₂e/);
      assert.ok(fromTrace, `${lang}@${width}: the calculation trace carries no tCO₂e figure`);
      const exact = Number(fromTrace[1].replace(/[.,]/g, ''));
      assert.ok(exact > 0, `${lang}@${width}: the trace's tCO₂e figure is not a number`);
      const expected = new Intl.NumberFormat(lang === 'th' ? 'th-TH' : 'en-GB', {maximumFractionDigits: 2}).format(exact / 1e6);
      assert.equal(stock.replace(/\s*M$/, ''), expected, `${lang}@${width}: the headline says ${stock} but the trace computes ${expected} M`);
      // The area beside it must be an area, in hectares.
      const area = (await page.locator('#kArea').innerText()).trim();
      assert.match(area, /\d/, `${lang}@${width}: the selected area reads "${area}"`);
      assert.match(area, /เฮกตาร์|hectares?|\bha\b/i, `${lang}@${width}: the selected area carries no unit (${area})`);
      // The map that carries the figure must be on the page and large enough to use.
      const box = await page.locator('#map').boundingBox();
      assert.ok(box && box.height > 300 && box.width > 300, `${lang}@${width}: the Thailand map is not on the page (${box ? `${Math.round(box.width)}×${Math.round(box.height)}` : 'missing'})`);
      // The workbench's own claim is that it CALCULATES and EXPORTS, browser-locally. A
      // headline figure on a map is not that claim; the calculation and the file a reader
      // takes away are. So the example is run, and the export is opened and read.
      await page.locator('#place').selectOption('TH50');
      await page.waitForFunction(() => /Chiang Mai|เชียงใหม่/.test(document.querySelector('#selectionName')?.textContent || ''), null, {timeout: 30000});
      await clickControl(page, '.advanced-tools>summary');
      await clickControl(page, '.lenses [data-tab=project]');
      await page.locator('#example').click();
      await page.locator('#boundaryInfo').waitFor({state: 'visible', timeout: 30000});
      await clickControl(page, '.advanced-tools>summary');
      await clickControl(page, '.lenses [data-tab=calculate]');
      await page.locator('#calculationForm [type=submit]').click();
      await page.waitForFunction(() => /\d/.test(document.querySelector('#result')?.textContent || ''), null, {timeout: 30000});
      // What the reader sees and what the file carries must be the same number.
      const shown = (await page.locator('#result .result-value').first().innerText()).trim();
      const shownNumber = Number(shown.replace(/[^\d.]/g, ''));
      assert.ok(Number.isFinite(shownNumber) && shownNumber > 0, `${lang}@${width}: the calculation shows "${shown}", which is not a figure`);
      const download = page.waitForEvent('download');
      await page.locator('#exportJSON').click();
      const receipt = await download;
      assert.ok(receipt.suggestedFilename().endsWith('.json'), `the export is named "${receipt.suggestedFilename()}", which is not a JSON file`);
      const exported = JSON.parse(await readFile(await receipt.path(), 'utf8'));
      // The example is illustrative and stays labelled as such, and no export ever claims
      // issued credits or a connected model: this product weighs a landscape and does not
      // mint one. These come FIRST, because they are the claims the file makes about itself.
      assert.equal(exported.issuedCredits, null, 'the export claims issued credits');
      assert.equal(exported.aiModel, null, 'the export claims a connected model');
      assert.equal(exported.status, 'illustrative-unverified-estimate', `the export claims "${exported.status}" for an illustrative example`);
      // What the reader sees and what the file carries must be the same number.
      assert.ok(Math.abs(exported.result?.net - shownNumber) < 0.01, `the export says ${exported.result?.net} and the page shows ${shownNumber}`);
    },
  },
  {
    name: 'the About view',
    path: lang => `/?lang=${lang}`,
    ready: '#kStock',
    settle: async (page, lang) => {
      await clickControl(page, '#aboutTab');
      // The About view fills its figures from the ledger when it opens, so the wait is for a
      // figure that arrives — not for the container that holds it.
      await page.waitForFunction(() => {
        const el = document.querySelector('#aboutBody [data-fig="tverCount"]');
        return !!el && /\d/.test(el.textContent || '');
      }, null, {timeout: 60000});
    },
    prove: async (page, lang, width) => {
      // The About view states its figures and fills them from the shipped ledger. The claim
      // "every figure filled live from the shipped ledger" is the product's own, so it is
      // checked against the data the same site serves.
      const stated = (await page.locator('#aboutBody [data-fig="tverCount"]').first().innerText()).trim();
      const tgo = await fetchJson(page, 'data/tgo/tver-forestry.json');
      assert.equal(
        stated.replace(/[^\d]/g, ''),
        String(tgo.national.projects),
        `${lang}@${width}: the About view says ${stated} registry records; the snapshot ships ${tgo.national.projects}`
      );
      const text = (await page.locator('#aboutBody').textContent()) || '';
      const provinces = lang === 'th' ? text.match(/ผลรวม (\d+) จังหวัด/) : text.match(/sum of (\d+) provinces/);
      assert.ok(provinces, `${lang}@${width}: the About view does not state how many provinces it covers`);
      const ledger = await fetchJson(page, 'data/ledger/provinces.json');
      assert.equal(
        Number(provinces[1]),
        ledger.provinces.length,
        `${lang}@${width}: the About view says ${provinces[1]} provinces; the ledger ships ${ledger.provinces.length}`
      );
    },
  },
  {
    name: 'the regional workspace',
    path: lang => `/sea.html?lang=${lang}`,
    ready: 'body[data-ready]',
    prove: async (page, lang, width) => {
      // Every view must open and must show its own content.
      for (const view of ['map', 'evidence', 'compare', 'research']) {
        await page.evaluate(v => {
          const btn = document.querySelector(`button[data-sea-view="${v}"]`);
          if (btn && btn.getBoundingClientRect().width > 0) {btn.click(); return;}
          const sel = document.querySelector('#seaView');
          if (sel) {sel.value = v; sel.dispatchEvent(new Event('change', {bubbles: true}));}
        }, view);
        await page.waitForFunction(v => document.body.dataset.seaView === v, view, {timeout: 30000});
      }
      // One name per view: the phone selector and the desktop button must not drift apart.
      const names = await page.evaluate(() => {
        const out = {};
        for (const o of document.querySelector('#seaView').options) {
          const btn = document.querySelector(`button[data-sea-view="${o.value}"]`);
          out[o.value] = {select: o.text, button: btn ? btn.textContent : null};
        }
        return out;
      });
      for (const [view, n] of Object.entries(names)) {
        if (n.button === null) continue;
        assert.equal(n.select, n.button, `${lang}@${width}: the ${view} view is named "${n.select}" in the selector and "${n.button}" on the button`);
      }
      // The country panel must carry a unit and a dated source on every published number.
      await page.evaluate(() => {const sel = document.querySelector('#seaView'); sel.value = 'evidence'; sel.dispatchEvent(new Event('change', {bubbles: true}));});
      await page.waitForFunction(() => document.body.dataset.seaView === 'evidence' && document.querySelectorAll('#countryNumbers div[data-number]').length >= 9, null, {timeout: 30000});
      const rows = page.locator('#countryNumbers div[data-number]');
      for (const row of await rows.all()) {
        const note = (await row.locator('small').innerText()).trim();
        assert.ok(/\d{4}/.test(note), `${lang}@${width}: a country number has no dated source note`);
      }
      // The comparison table must keep its header and its periods.
      await page.evaluate(() => {const sel = document.querySelector('#seaView'); sel.value = 'compare'; sel.dispatchEvent(new Event('change', {bubbles: true}));});
      await page.waitForFunction(() => document.body.dataset.seaView === 'compare' && document.querySelectorAll('#countryRows tr').length === 11, null, {timeout: 30000});
      const head = await page.locator('#countryHead').innerText();
      for (const period of ['2000', '2001–2025', '2023']) assert.ok(head.includes(period), `${lang}@${width}: the table header lost the period ${period}`);
      // The regional workspace covers the countries the snapshot ships — not a number it
      // decided on. The comparison table lists them all.
      const snapshot = await fetchJson(page, 'data/sea/snapshot.json');
      const tableRows = await page.locator('#countryRows tr').count();
      assert.equal(
        tableRows,
        snapshot.countries.length,
        `${lang}@${width}: the comparison table lists ${tableRows} countries; the snapshot ships ${snapshot.countries.length}`
      );
    },
  },
  {
    name: 'the Bible',
    path: lang => `/bible.html?lang=${lang}`,
    ready: '.prose',
    settle: async page => {
      // The reader renders its corpus before the counter means anything.
      await page.waitForFunction(() => document.querySelectorAll('#results a').length > 0, null, {timeout: 60000});
    },
    prove: async (page, lang, width) => {
      // The corpus must have rendered: a chapter with a title, a body, and its own sources.
      const title = (await page.locator('#article h1').first().innerText()).trim();
      assert.ok(title.length > 0, `${lang}@${width}: the Bible's chapter has no title`);
      const body = (await page.locator('#article .prose').first().innerText()).trim();
      assert.ok(body.length > 200, `${lang}@${width}: the Bible's chapter body is ${body.length} characters long`);
      const sources = await page.locator('#sources .source').count();
      assert.ok(sources >= 1, `${lang}@${width}: the Bible's chapter "${title}" names no source`);
      // The counter states how many chapters are showing and how many the reader holds. Both
      // must be the whole corpus, and the corpus must be the one this site ships.
      const count = (await page.locator('#count').innerText()).trim();
      const parsed = count.match(/(\d+)\s*\/\s*(\d+)\s*(?:บท|chapters)/);
      assert.ok(parsed, `${lang}@${width}: the Bible's counter reads "${count}", which is not a count of chapters`);
      const shown = Number(parsed[1]);
      const total = Number(parsed[2]);
      assert.equal(shown, total, `${lang}@${width}: the Bible shows ${shown} of ${total} chapters — the reader is not seeing the whole corpus`);
      const listed = await page.locator('#results a').count();
      assert.equal(total, listed, `${lang}@${width}: the Bible's counter says ${total} chapters and it lists ${listed}`);
      const corpus = (await fetchJson(page, 'data/bible.json')).chapters.length;
      assert.equal(total, corpus, `${lang}@${width}: the Bible's counter says ${total} chapters; the corpus this site ships holds ${corpus}`);
    },
  },
  {
    name: 'the research notebook',
    path: lang => `/research-${lang}.html`,
    ready: '.research-intro',
    prove: async (page, lang, width) => {
      // The index states a number of chapters; the notebook must hold that many.
      const toc = (await page.locator('.research-toc summary').innerText()).trim();
      const parsed = toc.match(/(\d+)\s*(?:บท|chapters)/);
      assert.ok(parsed, `${lang}@${width}: the research notebook's index reads "${toc}", which is not a count of chapters`);
      const stated = Number(parsed[1]);
      const links = await page.locator('.research-toc li a').count();
      assert.equal(stated, links, `${lang}@${width}: the notebook's index says ${stated} chapters and lists ${links}`);
      const sections = await page.locator('h2[id^="section-"]').count();
      assert.equal(stated, sections, `${lang}@${width}: the notebook's index says ${stated} chapters and the notebook holds ${sections}`);
      // The skip link must land on the first chapter, not on the front matter.
      await page.locator('.skip-link').evaluate(el => el.focus());
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => location.hash === '#section-1', null, {timeout: 10000});
    },
  },
  {
    name: 'the guide',
    path: lang => `/guide-${lang}.html`,
    ready: '.manual-routes',
    prove: async (page, lang, width) => {
      const routes = await page.locator('.manual-routes a').count();
      assert.ok(routes >= 3, `${lang}@${width}: the guide offers ${routes} routes`);
      // Every route must name itself, on the page, in the language the reader chose.
      for (const route of await page.locator('.manual-routes a').all()) {
        const title = (await route.locator('b').innerText()).trim();
        assert.ok(title.length > 0, `${lang}@${width}: a guide route has no title`);
        const desc = (await route.locator('span').innerText()).trim();
        assert.ok(desc.length > 0, `${lang}@${width}: the guide route "${title}" has no description`);
      }
      // The guide tells the reader how big the Bible is. That number must be the corpus this
      // same site ships.
      //
      // The text is read from the DOM rather than from the rendered page, because the guide
      // keeps its reference chapters in native disclosures and a collapsed disclosure is not
      // in innerText. The claim is about what the guide PUBLISHES; whether the reader can
      // reach that paragraph is a separate question, and the law's own gates measure it.
      const text = await page.evaluate(() => {
        const main = document.querySelector('main') || document.body;
        return (main.textContent || '').replace(/\s+/g, ' ');
      });
      const stated = lang === 'th' ? text.match(/(\d+)\s*บท ไทย\/อังกฤษ/) : text.match(/(\d+)\s*TH\/EN chapters/);
      assert.ok(stated, `${lang}@${width}: the guide does not say how many chapters the Bible holds`);
      const corpus = (await fetchJson(page, 'data/bible.json')).chapters.length;
      assert.equal(Number(stated[1]), corpus, `${lang}@${width}: the guide says the Bible holds ${stated[1]} chapters; the corpus this site ships holds ${corpus}`);
    },
  },
];
