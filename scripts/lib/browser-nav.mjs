// A page that is slow to arrive is not a broken page.
//
// The browser suites run against a live release as well as against a local build. Right after
// a deploy the first request for a page comes from a cold edge cache, and that request can
// take longer than the default navigation timeout: the page is fine, the network was slow.
// A suite that fails on that reports a network condition as a defect in the site — and a
// release verification that cries wolf is a release verification people learn to ignore.
//
// So a navigation that times out is tried once more. A navigation that fails for any other
// reason — a refused connection, a bad host, a DNS failure — is not retried: that is a real
// failure and it must show.
//
// The rule is used the same way by every suite, so it is written once here.
import {setTimeout as sleep} from 'node:timers/promises';

// A pattern, matched with .test(). It was a regular expression CALLED as a function, which
// is a TypeError, and that TypeError was thrown from inside the catch that was supposed to
// classify the failure. So the helper never retried anything: a timed-out navigation was not
// retried, it was replaced by "LOOKS_LIKE_A_TIMEOUT is not a function", and every real
// navigation failure was reported as that same lie instead of the cause. Twenty suites import
// this helper, and none of them could have told the difference.
//
// scripts/browser-nav-falsifier.mjs now proves both halves: a timeout IS retried, and a
// failure that is not a timeout is NOT retried and reaches the caller intact.
const LOOKS_LIKE_A_TIMEOUT = /timeout|exceeded|timed out/i;

/**
 * Cancel a navigation that is still in flight.
 *
 * When `page.goto` times out, Playwright rejects the promise but does NOT cancel the request:
 * the browser is still loading that document. A retry to the same URL then collides with it,
 * Chromium aborts the new request, and the helper reports ERR_ABORTED — a network error that
 * never happened, about a page the site serves perfectly well. Measured: with a server that
 * answers the first request slowly and the second quickly, the retry without this step never
 * reaches the server at all.
 *
 * `about:blank` always answers, so navigating there retires the pending request and leaves
 * the browser ready for a real navigation.
 *
 * @param {import('playwright').Page} page
 */
async function cancelPendingNavigation(page) {
  try {
    await page.goto('about:blank', {waitUntil: 'commit', timeout: 10000});
  } catch {
    // If the blank page cannot be reached either, the retry below will report the truth.
  }
}

/**
 * Navigate, retrying once if the navigation timed out.
 *
 * @param {import('playwright').Page} page
 * @param {string} url
 * @param {{attempts?:number, retryDelay?:number, waitUntil?:string, timeout?:number}} [options]
 */
export async function gotoRetry(page, url, options = {}) {
  const {attempts = 2, retryDelay = 1500, ...navigation} = options;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await page.goto(url, navigation);
    } catch (err) {
      if (!LOOKS_LIKE_A_TIMEOUT.test(String(err && err.message))) throw err;
      lastError = err;
      if (attempt === attempts) break;
      await sleep(retryDelay);
      await cancelPendingNavigation(page);
    }
  }
  throw lastError;
}
