#!/usr/bin/env node
// The law's instrument, run as ONE command.
//
// Each gate below is a measurement of the running interface, and each one used to expect a
// server that a human had already started on a hardcoded port. That made the instrument
// unrunnable in the ordinary way: `npm run test:spatial` failed on any machine where
// something else held 8788, and the four gates disagreed about which port that was (8788 for
// two of them, 8801 for the other two). A stale server from an earlier session on that port
// answers instead, and the measurement is of a build nobody asked about.
//
// This script fixes that in three ways:
//
//   1. It BUILDS first. The generated pages in public/ are not in git, so a measurement taken
//      without a build can be a mix of yesterday's HTML and today's CSS. The law is measured
//      against what the release would actually ship.
//   2. It starts this project's own server, on a port it chose, and measures that. The server
//      is proved to be this build by the manifest it publishes, and it is stopped afterwards.
//   3. It runs every gate against that one server, so the suite is a single command with a
//      single verdict.
//
//   node scripts/spatial-suite.mjs            the shell gates, the detectors, the table proof
//   node scripts/spatial-suite.mjs --deep     also the 546-page content audit (slow)
//   node scripts/spatial-suite.mjs --no-build measure the build already in public/
//
// BASE_URL still wins: set it to measure a live release instead of a local build.
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {measurementTarget} from './lib/local-server.mjs';

const DEEP = process.argv.includes('--deep');
const NO_BUILD = process.argv.includes('--no-build');

const STEPS = [
  {name: 'table wrappers', script: 'scripts/check-table-wrappers.mjs'},
  {name: 'spatial gate', script: 'scripts/spatial-gate.mjs'},
  {name: 'regional two-line header', script: 'scripts/sea-header-proof.mjs'},
  {name: 'detector self-test', script: 'scripts/spatial-detector-self-test.mjs'},
  {name: 'table proof', script: 'scripts/msh-table-proof.mjs'},
  ...(DEEP ? [{name: 'deep content audit', script: 'scripts/spatial-deep-probe.mjs'}] : []),
];

const run = (script, base) =>
  new Promise(resolveRun => {
    const child = spawn(process.execPath, [script], {
      env: {...process.env, BASE_URL: base},
      stdio: 'inherit',
    });
    child.on('exit', code => resolveRun(code ?? 1));
  });

const runCommand = (command, args) =>
  new Promise(resolveRun => {
    const child = spawn(command, args, {stdio: 'inherit'});
    child.on('exit', code => resolveRun(code ?? 1));
  });

// The pages the law measures are generated, so the build has to be current. Without this a
// suite can pass against yesterday's HTML while today's CSS sits unmeasured beside it.
if (!NO_BUILD) {
  console.log('--- build ---');
  if ((await runCommand('npm', ['run', 'build'])) !== 0) {
    console.error('\nFAIL spatial suite: the build failed');
    process.exit(1);
  }
}

const target = await measurementTarget();
const localCommit = await readFile('public/version.json', 'utf8')
  .then(t => JSON.parse(t).commit)
  .catch(() => null);

if (target.commit) {
  console.log(`measuring build ${target.commit} at ${target.base}`);
  if (localCommit && localCommit !== target.commit) {
    console.error(`\nFAIL spatial suite: the server serves ${target.commit} but public/ holds ${localCommit}`);
    await target.stop();
    process.exit(1);
  }
} else {
  // A caller-named server. Report what it is serving, because a measurement of a different
  // build than the one on disk is the mistake this suite exists to prevent.
  const served = await fetch(`${target.base}/version.json`)
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null);
  console.log(`measuring ${target.base} (serving ${served?.commit ?? 'an unknown build'})`);
  if (served?.commit && localCommit && served.commit !== localCommit) {
    console.log(
      `note: the live build ${served.commit} differs from the local build ${localCommit}. That is expected when auditing a release.`
    );
  }
}

let failed = null;
try {
  for (const step of STEPS) {
    console.log(`\n--- ${step.name} ---`);
    const code = await run(step.script, target.base);
    if (code !== 0) {
      failed = step.name;
      break;
    }
  }
} finally {
  await target.stop();
}

if (failed) {
  console.error(`\nFAIL spatial suite: ${failed}`);
  process.exit(1);
}
console.log('\nPASS spatial suite: every gate in the law ran against this build.');
