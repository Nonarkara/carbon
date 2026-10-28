#!/usr/bin/env node
// Every browser suite in this repository, run as ONE command against ONE server.
//
// Fifteen of the seventeen browser suites defaulted to http://127.0.0.1:8788 and expected a
// server a human had already started. On a machine where another project already held 8788,
// `npm run test:browser` measured THAT app's pages and reported the result as this project's
// — a browser suite with no identity check can pass while proving nothing about this
// interface. The spatial gate was hardened against exactly this; the browser suites were
// left pointing at the same trap.
//
// This runner starts this project's own server on a port it chose, proves the server is this
// build by the manifest it publishes, runs every suite against it, and stops it afterwards.
// Nothing to start by hand, nothing to forget, and no way to measure a stranger's app.
//
//   node scripts/browser-suite.mjs              all browser suites against a local build
//   node scripts/browser-suite.mjs --no-build   measure the build already in public/
//   BASE_URL=https://carbon.nonarkara.org node scripts/browser-suite.mjs   against a release
import {spawn} from 'node:child_process';
import {measurementTarget} from './lib/local-server.mjs';
import {assertProjectServer} from './lib/server-identity.mjs';

const NO_BUILD = process.argv.includes('--no-build');

// The suites, in the order CI ran them. Every one of these exercises a real reader path.
const SUITES = [
  ['browser flows', 'scripts/browser-test.mjs'],
  ['map tools', 'scripts/map-tools-browser-test.mjs'],
  ['client demo', 'scripts/client-demo-test.mjs'],
  ['manual walkthrough', 'scripts/manual-walkthrough.mjs'],
  ['privacy', 'scripts/privacy-browser-test.mjs'],
  ['forest watch', 'scripts/forest-watch-browser-test.mjs'],
  ['flat ui', 'scripts/flat-ui-browser-test.mjs'],
  ['bible design', 'scripts/bible-design-browser-test.mjs'],
  ['credit figures', 'scripts/credit-figure-browser-test.mjs'],
  ['sea', 'scripts/sea-browser-test.mjs'],
  ['ship', 'scripts/ship-browser-test.mjs'],
  ['release audit', 'scripts/release-audit-browser-test.mjs'],
  ['anti-slop', 'scripts/anti-slop-browser-test.mjs'],
  ['carbona', 'scripts/carbona-browser-test.mjs'],
  ['workspace', 'scripts/workspace-browser-test.mjs'],
  ['design review', 'scripts/design-review.mjs'],
  ['academic', 'scripts/academic-browser-test.mjs'],
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

if (!NO_BUILD) {
  console.log('--- build ---');
  if ((await runCommand('npm', ['run', 'build'])) !== 0) {
    console.error('\nFAIL browser suite: the build failed');
    process.exit(1);
  }
}

// A caller-named server is still held to the identity check: a browser suite that measures
// another project's pages and calls the result a pass is worse than one that measures nothing.
const target = await measurementTarget();
if (!target.commit) await assertProjectServer(target.base);
console.log(`measuring ${target.commit ? `build ${target.commit}` : target.base} at ${target.base}`);

// Every suite runs, even after one fails, and every verdict is kept.
//
// The runner used to stop at the first failure. That made a broken build cost one fix cycle
// per defect: the owner was shown one suite's complaint, fixed it, and was then shown the
// next suite's complaint, and so on — seventeen rounds for seventeen suites. The law the
// project works under says the opposite: when you find spatial hallucination, massacre it, and
// massacre means the whole census in one pass, not a sample. The instrument that measures the
// site has to obey the same rule, or it cannot tell the owner how much is left.
//
// The suites are independent — each is its own process against the same server — so running
// the rest after a failure costs time and loses nothing. The verdict is still a single one:
// the suite exits non-zero if any suite failed.
const verdicts = [];
try {
  for (const [name, script] of SUITES) {
    console.log(`\n--- ${name} ---`);
    const code = await run(script, target.base);
    verdicts.push({name, ok: code === 0});
  }
} finally {
  await target.stop();
}

const failed = verdicts.filter(v => !v.ok);
if (failed.length) {
  console.error(`\n--- verdict ---`);
  for (const v of verdicts) console.error(`  ${v.ok ? 'ok  ' : 'FAIL'}  ${v.name}`);
  console.error(
    `\nFAIL browser suite: ${failed.length} of ${verdicts.length} suites failed — ${failed.map(v => v.name).join(', ')}.`
  );
  process.exit(1);
}
console.log(`\nPASS browser suite: ${SUITES.length} suites ran against this build.`);
