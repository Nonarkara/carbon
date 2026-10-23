// A dead browser must not read as a clean page, and must not read as a layout finding.
//
// The law's gates run a real browser over hundreds of pages. On a busy machine that browser
// gets killed — the usual cause is memory pressure from other work. Two things must hold:
//
//   1. The gate recovers. The browser is relaunched and the page is measured again, so one
//      dead page does not discard the pages after it.
//   2. The gate never invents a pass. A page that could not be measured twice is recorded as
//      unmeasurable, and an unmeasured page fails the audit.
//
// And an error that is NOT a dead browser must pass straight through: a layout finding, a
// missing selector, a wrong assertion — those are the gate's business, not the harness's.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isDeadTarget, measureWithRecovery} from '../scripts/lib/browser-resilience.mjs';

const DEAD = new Error('page.waitForTimeout: Target page, context or browser has been closed');

test('a dead browser is recognised as dead', () => {
  assert.equal(isDeadTarget(DEAD), true);
  assert.equal(isDeadTarget(new Error('Protocol error (Page.navigate): Target closed')), true);
  assert.equal(isDeadTarget(new Error('assert.ok failed: the first screen holds no readable content')), false);
  assert.equal(isDeadTarget(new Error('the browser has been closed')), true);
});

test('a dead browser is relaunched and the page is measured again', async () => {
  let attempts = 0;
  let relaunches = 0;
  const recorded = [];
  const outcome = await measureWithRecovery({id:'chapter-7'}, {
    measure: async () => {
      attempts++;
      if (attempts === 1) throw DEAD;
    },
    relaunch: async () => {
      relaunches++;
    },
    record: (job, err) => recorded.push({job, err}),
  });
  assert.equal(outcome, 'measured');
  assert.equal(attempts, 2, 'the page is measured again after the browser dies');
  assert.equal(relaunches, 1, 'the browser is relaunched exactly once');
  assert.equal(recorded.length, 0, 'a recovered page is not recorded as unmeasurable');
});

test('a page that cannot be measured twice is recorded, never quietly passed', async () => {
  let attempts = 0;
  const recorded = [];
  const outcome = await measureWithRecovery({id:'chapter-9'}, {
    measure: async () => {
      attempts++;
      throw DEAD;
    },
    relaunch: async () => {},
    record: (job, err) => recorded.push({job, err}),
  });
  assert.equal(outcome, 'unmeasurable');
  assert.equal(attempts, 2);
  assert.equal(recorded.length, 1, 'the page is reported as unmeasurable');
  assert.equal(recorded[0].job.id, 'chapter-9');
});

test('an error that is not a dead browser passes straight through', async () => {
  let relaunches = 0;
  await assert.rejects(
    measureWithRecovery({id:'chapter-3'}, {
      measure: async () => {
        throw new Error('assert.equal failed: research-th.html scrolls sideways');
      },
      relaunch: async () => {
        relaunches++;
      },
      record: () => assert.fail('a real finding must never be recorded as unmeasurable'),
    }),
    /scrolls sideways/,
  );
  assert.equal(relaunches, 0, 'a real finding is not a browser failure and is not retried');
});
