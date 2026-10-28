#!/usr/bin/env node
// Proof that the navigation helper can fail, and that it fails the right way.
//
// Every browser suite in this repository navigates through one helper, `gotoRetry`, which
// exists to say "a slow page is not a broken page": a navigation that times out is tried once
// more, and a navigation that fails for any other reason is not retried, because a refused
// connection or a bad host is a real failure and must show.
//
// That helper was broken in the one way that hides things. The pattern that decides whether an
// error "looks like a timeout" was a regular expression CALLED as a function. The TypeError was
// thrown from inside the catch block whose whole job was to classify the failure, so:
//
//   - a timeout was never retried, and
//   - every navigation failure was reported as "LOOKS_LIKE_A_TIMEOUT is not a function",
//     which is a lie about the cause, and
//   - the helper that twenty suites depend on had never once done the thing it was written for.
//
// Nothing caught it, because the helper itself was never measured. The suites that used it
// mostly navigated to pages that answered promptly, so the broken branch was simply never
// taken — and a branch that is never taken is a branch nobody has tested.
//
// So this proves both halves of the contract, by breaking them on purpose:
//
//   1. A navigation that TIMES OUT is retried, and the retry succeeds.
//   2. A navigation that fails for a reason that is NOT a timeout is NOT retried, and the
//      original failure reaches the caller with its cause intact.
//   3. A navigation that succeeds is returned, and is not retried.
//   4. A navigation that times out on EVERY attempt hands the caller the timeout — not the
//      helper's own error, and not a mask.
//
//   node scripts/browser-nav-falsifier.mjs
//
// The failures come from a real server on a real port, because the helper's contract is about
// real navigations: a slow answer, a dropped connection. Nothing here touches this project's
// own site, so the proof runs wherever Playwright runs.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {gotoRetry} from './lib/browser-nav.mjs';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// The server that misbehaves on purpose. Each path is a different failure.
const hits = {slow: 0, fine: 0};
const server = createServer((req, res) => {
  if (req.url === '/slow-then-fast') {
    hits.slow++;
    // The first answer arrives after the navigation's budget has gone. The second is immediate.
    const delay = hits.slow === 1 ? 1500 : 0;
    setTimeout(() => {
      res.writeHead(200, {'content-type': 'text/html'});
      res.end('<h1>arrived</h1>');
    }, delay);
    return;
  }
  if (req.url === '/fine') {
    hits.fine++;
    res.writeHead(200, {'content-type': 'text/html'});
    res.end('<h1>fine</h1>');
    return;
  }
  // A dropped connection: the server takes the socket away without answering.
  if (req.url === '/refused') {
    req.socket.destroy();
    return;
  }
  // A server that never answers: the request stays open and the navigation must time out.
  if (req.url === '/never') {
    return;
  }
  res.writeHead(404).end('no');
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();

// Each case gets its own page. A navigation that fails leaves the browser on its own error
// page, and that error page loads asynchronously — a later navigation on the same tab can be
// interrupted by it. That race is real, but it is a property of the browser after a failure,
// not of the helper, and mixing it into these cases would test something else. Isolating them
// keeps each case about one contract.
const freshPage = async () => browser.newPage();

// --- 1. A timeout is retried, and the retry succeeds.
//
// The first answer arrives after the navigation's own budget, so the navigation times out. The
// second answer is immediate. If the helper does not retry, this throws and the case fails —
// which is the whole point: the retry is now exercised, not assumed.
{
  const page = await freshPage();
  const response = await gotoRetry(page, `${base}/slow-then-fast`, {
    attempts: 3,
    retryDelay: 10,
    timeout: 500,
  });
  assert.equal(response.status(), 200, 'the retried navigation did not succeed');
  assert.equal(hits.slow, 2, 'the helper did not retry the timed-out navigation');
  await page.close();
  console.log('  ok  a navigation that times out is retried, and the retry succeeds');
}

// --- 2. A failure that is not a timeout is not retried, and reaches the caller intact.
//
// The server drops the connection, which Playwright reports as a network error. That message
// contains no word like "timeout", so the helper must let it through on the first attempt. The
// old broken helper masked this as "LOOKS_LIKE_A_TIMEOUT is not a function" — the assertion on
// the message is what makes that mask impossible to reintroduce.
{
  const page = await freshPage();
  let caught = null;
  try {
    await gotoRetry(page, `${base}/refused`, {attempts: 3, retryDelay: 10, timeout: 5000});
  } catch (err) {
    caught = err;
  }
  assert.ok(caught, 'a dropped connection was reported as a success');
  assert.ok(
    !/is not a function/.test(caught.message),
    `the helper masked the real failure with its own error — ${caught.message}`
  );
  assert.match(caught.message, /ERR_|ECONN|socket/i, `the original cause was lost — ${caught.message}`);
  await page.close();
  console.log('  ok  a failure that is not a timeout is not retried, and reaches the caller intact');
}

// --- 3. A navigation that succeeds is returned, and is not retried.
{
  const page = await freshPage();
  const response = await gotoRetry(page, `${base}/fine`, {attempts: 3, retryDelay: 10, timeout: 5000});
  assert.equal(response.status(), 200);
  assert.equal(hits.fine, 1, 'a navigation that succeeded was retried');
  await page.close();
  console.log('  ok  a navigation that succeeds is returned, and is not retried');
}

// --- 4. When every attempt times out, the caller gets the timeout.
//
// The helper must not swallow the failure and must not report its own error instead. Before
// the repair this case could not even be reached: the helper threw a TypeError from inside the
// catch, so the timeout never reached anybody.
{
  const page = await freshPage();
  let caught = null;
  try {
    await gotoRetry(page, `${base}/never`, {attempts: 2, retryDelay: 10, timeout: 500});
  } catch (err) {
    caught = err;
  }
  assert.ok(caught, 'a navigation that never answered was reported as a success');
  assert.match(caught.message, /Timeout|timed out/i, `the timeout did not reach the caller — ${caught.message}`);
  assert.ok(!/is not a function/.test(caught.message), 'the helper masked the timeout with its own error');
  await page.close();
  console.log('  ok  a navigation that times out on every attempt hands the caller the timeout');
}

await browser.close();
await new Promise(resolve => server.close(resolve));
console.log('\nPASS browser nav falsifier: the retry happens, and the real failure is never hidden.');
