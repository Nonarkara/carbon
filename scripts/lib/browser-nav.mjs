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

const LOOKS_LIKE_A_TIMEOUT = /timeout|exceeded|timed out/i;

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
      if (!LOOKS_LIKE_A_TIMEOUT(String(err && err.message))) throw err;
      lastError = err;
      if (attempt === attempts) break;
      await sleep(retryDelay);
    }
  }
  throw lastError;
}
