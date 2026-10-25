// The release runner, and the difference between a failure and an interruption.
//
// A release that dies because another process on a shared machine sent a signal to its test
// runner is a release that fails for a condition outside the site. A release that retries that
// is honest. A release that retries a real failure is not — so that case must stay fatal, and
// this test proves both halves.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {run, INTERRUPTED} from '../scripts/lib/release-run.mjs';

// A child that counts its own attempts, so the test can prove how many times it was tried.
const counting = (marker, behaviour) => `
  const fs=require('fs');
  const marker=process.env.CARBON_RELEASE_RUN_MARKER;
  const seen=fs.existsSync(marker)?Number(fs.readFileSync(marker,'utf8')):0;
  fs.writeFileSync(marker,String(seen+1));
  ${behaviour}
`;

function marker() {
  const path = join(tmpdir(), `carbon-release-run-${process.pid}-${Math.random().toString(36).slice(2)}.txt`);
  rmSync(path, {force: true});
  process.env.CARBON_RELEASE_RUN_MARKER = path;
  return path;
}

const attempts = path => (existsSync(path) ? Number(readFileSync(path, 'utf8')) : 0);

test('a command that succeeds returns zero', async () => {
  const code = await run(process.execPath, ['-e', 'process.stdout.write("hello from the gate")']);
  assert.equal(code, 0);
});

test('a command that fails returns non-zero and is not retried', async () => {
  const path = marker();
  const code = await run(process.execPath, ['-e', counting(path, 'process.stderr.write("x a real failure");process.exit(1);')]);
  assert.notEqual(code, 0);
  assert.equal(attempts(path), 1, 'a real failure is tried once');
});

test('an interrupted run is retried once and a clean second attempt passes', async () => {
  const path = marker();
  const code = await run(process.execPath, ['-e', counting(path, `
    if(seen===0){process.stderr.write('Interrupted while running:\\n\u26a0 tests/other.test.mjs');process.exit(1);}
    process.stdout.write('the second attempt ran every test');
  `)], {retryOnceOn: INTERRUPTED});
  assert.equal(code, 0, 'an interruption followed by a clean run is a pass');
  assert.equal(attempts(path), 2, 'the interrupted run was tried twice');
});

test('two interruptions are still a failure', async () => {
  const path = marker();
  const code = await run(process.execPath, ['-e', counting(path, `
    process.stderr.write('Interrupted while running:\\n\u26a0 tests/other.test.mjs');
    process.exit(1);
  `)], {retryOnceOn: INTERRUPTED});
  assert.notEqual(code, 0, 'the machine does not get to veto the release forever');
  assert.equal(attempts(path), 2, 'it was tried twice and no more');
});

test('a real failure is not retried, even when a retry is allowed', async () => {
  const path = marker();
  const code = await run(process.execPath, ['-e', counting(path, `
    process.stderr.write('\u2716 something is genuinely wrong');
    process.exit(1);
  `)], {retryOnceOn: INTERRUPTED});
  assert.notEqual(code, 0);
  assert.equal(attempts(path), 1, 'a real failure is tried once');
});
