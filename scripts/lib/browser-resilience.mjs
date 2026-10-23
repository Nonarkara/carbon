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

import {setTimeout as sleep} from 'node:timers/promises';

/**
 * Measure one job, recovering from a dead browser.
 *
 * Two failures have to be told apart. A browser that dies WHILE measuring is the machine
 * under pressure: relaunch and measure again. A browser that will not START is the same
 * pressure seen from the other side, and it usually clears in a second or two, so the launch
 * is retried a few times before the page is given up on.
 *
 * Either way, a page that cannot be measured is recorded as unmeasurable. The caller decides
 * what that means — for an audit, it means the audit fails, because a clean audit that did
 * not run is not a clean audit.
 *
 * @param {object} job the thing to measure
 * @param {{measure:(job:object)=>Promise<void>, relaunch:()=>Promise<void>, record:(job:object, err:Error)=>void, relaunchAttempts?:number}} parts
 * @returns {Promise<'measured'|'unmeasurable'>}
 */
export async function measureWithRecovery(job, {measure, relaunch, record, relaunchAttempts = 4}) {
  try {
    await measure(job);
    return 'measured';
  } catch (err) {
    if (!isDeadTarget(err)) throw err;

    // Bring a browser back up. A launch that dies on arrival is the machine, not the page.
    let up = false;
    for (let attempt = 0; attempt < relaunchAttempts; attempt++) {
      try {
        await relaunch();
        up = true;
        break;
      } catch (relaunchErr) {
        if (!isDeadTarget(relaunchErr)) throw relaunchErr;
        if (attempt === relaunchAttempts - 1) break;
        await sleep(2000 * (attempt + 1));
      }
    }
    if (!up) {
      record(job, err);
      return 'unmeasurable';
    }

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
