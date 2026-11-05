#!/usr/bin/env node
// Proof that the map-share check can fail.
//
// The law: "on a map product the map holds at least 60% of the first screen". The gate asserts
// that at every width it visits, and the floor is 55% at the narrow desktops where the map
// shares the screen with the assessment rail.
//
// A check that has never failed is a check nobody has to keep, and this one had never been
// shown to fire. So it is driven against the real page here:
//
//   1. The shipped layout is measured and it clears the floor.
//   2. The map is shrunk until it cannot, and the check must throw.
//   3. The floor itself is pinned: 60% at the widths the law names, 55% at the narrow desktops.
//
//   node scripts/map-share-falsifier.mjs
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {measurementTarget} from './lib/local-server.mjs';
import {mapShare, mapShareFloor, checkMapShare} from './lib/map-share.mjs';

const target = await measurementTarget();
const browser = await chromium.launch();
const page = await browser.newPage();

try {
  // 1. The shipped layout clears the floor at the narrowest desktop, where the floor is lower.
  await page.setViewportSize({width: 1101, height: 900});
  await page.goto(`${target.base}/?lang=th`, {waitUntil: 'domcontentloaded'});
  await page.locator('#kStock').filter({hasText: 'M'}).waitFor({timeout: 60000});
  const before = await page.evaluate(`(${mapShare.toString()})(document)`);
  checkMapShare(before, 1101, 'the shipped layout');
  console.log(`  ok  the shipped layout holds ${(before * 100).toFixed(1)}% and clears the floor`);

  // 2. Shrink the map until the floor is broken. The rail takes the space instead, which is
  //    exactly the trade that was tried and reverted — here it is used to break the check.
  await page.addStyleTag({content: 'body.dashboard:not([data-world-open]) .stage{grid-template-columns:minmax(320px,1fr) 700px}'});
  const after = await page.evaluate(`(${mapShare.toString()})(document)`);
  assert.ok(after < before, `the mutation did not shrink the map (${before} → ${after})`);
  let caught = null;
  try {
    checkMapShare(after, 1101, 'the shrunk map');
  } catch (err) {
    caught = err;
  }
  assert.ok(caught, `the check passed a map holding ${(after * 100).toFixed(1)}% of the screen`);
  assert.match(caught.message, /the map holds .* of the first screen/, `the check failed for the wrong reason: ${caught.message}`);
  console.log(`  ok  a map squeezed to ${(after * 100).toFixed(1)}% is caught → ${caught.message.split('\n')[0]}`);

  // 3. The floor is pinned where the law places it.
  assert.equal(mapShareFloor(390), 0.6, 'the phone floor is the law’s 60%');
  assert.equal(mapShareFloor(1024), 0.6, 'the tablet floor is the law’s 60%');
  assert.equal(mapShareFloor(1440), 0.6, 'the desktop floor is the law’s 60%');
  assert.equal(mapShareFloor(1101), 0.55, 'the narrowest desktop shares the screen with the assessment rail');
  assert.equal(mapShareFloor(1279), 0.55, 'the narrow desktop shares the screen with the assessment rail');
  assert.equal(mapShareFloor(1280), 0.6, 'above the narrow band the law’s 60% applies again');
  console.log('  ok  the floor is 60% where the law names it and 55% only across the narrow desktop band');
} finally {
  await browser.close();
  await target.stop();
}

console.log('\nPASS map-share falsifier: the shipped check fires when the map loses the screen, and the floor it holds is the law’s.');
