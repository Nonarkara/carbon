// A browser that dies is not a finding.
//
// The law's gates run a real browser over hundreds of pages. On a busy machine that browser
// can be killed — the classic cause is memory pressure while other work runs. The layout of
// the page has nothing to do with it, and the correct response is neither to pretend the page
// was fine nor to end the audit and throw away the pages that were measured.
//
// So: a dead browser is relaunched and the page is measured again. If it dies a second time,
// the page is recorded as unmeasurable — and an unmeasured page fails the audit, because a
// clean audit that did not run is not a clean audit.
//
// The rule lives here, once, and is tested directly, so a gate cannot quietly grow its own
// version of it.
import {chromium} from 'playwright';

/** Has the browser or the page gone away underneath us? */
export function isDeadTarget(err) {
  const m = String((err && err.message) || err || '');
  return /Target page, context or browser has been closed|Target closed|browser has been closed|has been closed|Protocol error|browserContext|Browser closed/i.test(m);
}

/**
 * Measure one job, recovering from a dead browser.
 *
 * @param {object} job the thing to measure
 * @param {{measure:(job:object)=>Promise<void>, relaunch:()=>Promise<void>, record:(job:object, err:Error)=>void}} parts
 * @returns {Promise<'measured'|'unmeasurable'>}
 */
export async function measureWithRecovery(job, {measure, relaunch, record}) {
  try {
    await measure(job);
    return 'measured';
  } catch (err) {
    if (!isDeadTarget(err)) throw err;
    await relaunch();
    try {
      await measure(job);
      return 'measured';
    } catch (err2) {
      if (!isDeadTarget(err2)) throw err2;
      record(job, err2);
      return 'unmeasurable';
    }
  }
}

/**
 * A browser that can be relaunched.
 *
 * The page is handed out as a getter, because the pages that use this hold the page in a
 * variable they reassign on relaunch — every measurement must use the current one.
 *
 * @param {{headless?:boolean}} [opts]
 */
export async function launchBrowser(opts = {}) {
  const {chromium} = await import('playwright');
  let browser = await chromium.launch(opts);
  let page = await browser.newPage();
  const watchers = [];
  page.on('pageerror', e => {
    for (const handler of watchers) handler(e);
  });
  return {
    get browser() {
      return browser;
    },
    get page() {
      return page;
    },
    onPageError(handler) {
      watchers.push(handler);
    },
    async relaunch() {
      try {
        await browser.close();
      } catch {
        // A browser that is already gone cannot be closed.
      }
      browser = await chromium.launch(opts);
      page = await browser.newPage();
      page.on('pageerror', e => {
        for (const handler of watchers) handler(e);
      });
    },
    async close() {
      try {
        await browser.close();
      } catch {
        // Closing a dead browser is not an error worth failing a gate for.
      }
    },
  };
}
