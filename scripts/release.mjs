// The release.
//
// A release must be exactly the commit it names, and the law must pass on the bytes that
// are actually published. This script arranges both, in one place:
//
//   1. The calling tree must be clean. Uncommitted work is not published, and saying so
//      loudly is better than shipping one agent's half-finished file under another's name.
//   2. The commit is exported into a pristine worktree and everything happens THERE: the
//      build, the unit tests, the law's gates, the 546-page audit. Nothing reads the
//      caller's mutable tree, so a concurrent write cannot reach the published bytes.
//   3. The uploaded directory is the one that was measured. The gates ran on these bytes;
//      these bytes go out.
//   4. The upload names the production branch explicitly, so the release lands on
//      carbon.nonarkara.org whether it was launched from a branch or from a detached
//      worktree.
//
// Usage: npm run deploy
import {resolve} from 'node:path';
import {assertCleanTree, createPristineTree, assertBuiltTreeMatchesCommit, headCommit, repoRoot, treeState} from './lib/release-tree.mjs';
import {run, INTERRUPTED} from './lib/release-run.mjs';
const root = repoRoot();

// A release that stops must still clean up after itself: the pristine worktree it exported
// lives in the repository's worktree list and in the temporary directory. process.exit() would
// skip that, so a failed release is a thrown error and the exit happens after the cleanup.
class ReleaseFailure extends Error {}
const fail = message => {
  throw new ReleaseFailure(message);
};

const project = process.env.CLOUDFLARE_PROJECT || 'forest-carbon-thailand';
const productionBranch = process.env.CLOUDFLARE_BRANCH || 'main';
// The live surface the release must prove. It is deliberately NOT BASE_URL: that variable
// points a gate at whatever server a caller chooses, and a release must be verified against the
// surface its users reach.
const liveBase = process.env.CLOUDFLARE_LIVE_URL || 'https://carbon.nonarkara.org';

/**
 * Wait for the edge to serve the commit that was just uploaded.
 *
 * An upload is not a release until the domain serves it, and the edge can take a moment to
 * propagate a new deployment. The wait is generous on purpose: a slow edge is a condition to
 * wait out, not a failure, and a tight budget here would fail releases that did ship.
 */
async function waitForLiveCommit(short, budgetMs = 180000) {
  const deadline = Date.now() + budgetMs;
  let served = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${liveBase}/version.json`, {signal: AbortSignal.timeout(5000)});
      if (res.ok) {
        const body = await res.json();
        served = body?.commit || null;
        if (served === short) return true;
      }
    } catch {
      // The edge is not answering yet. Wait and look again.
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  fail(`FAIL release: the live site still serves ${served || 'nothing'} after ${Math.round(budgetMs / 1000)}s; the upload was ${short}.`);
}

function step(name) {
  console.log(`\n--- ${name} ---`);
}


/**
 * What the deep audit actually found, read from its own report.
 *
 * A finding and a page that could not be measured are different facts about the release, and
 * the release treats them differently: one is the site, the other is the machine.
 *
 * @param {string} dir the tree the audit ran in
 * @returns {Promise<{findings:number, unmeasurable:number}>}
 */
async function readAuditVerdict(dir) {
  try {
    const {readFile} = await import('node:fs/promises');
    const report = JSON.parse(await readFile(resolve(dir, 'test-results/spatial/deep-report.json'), 'utf8'));
    let findings = 0;
    let unmeasurable = 0;
    for (const row of report.report || []) {
      if (row.error) unmeasurable++;
      findings += (row.offenders || []).length + (row.lawFindings || []).length;
    }
    return {findings, unmeasurable};
  } catch {
    // No report means the audit never got far enough to write one. Nothing was measured, and
    // nothing was found; treating that as "no findings" would be a pass the audit never gave.
    return {findings: 0, unmeasurable: -1};
  }
}

async function main() {
  // 1. The tree the command was launched in must be clean.
  step('release tree');
  let commit;
  try {
    commit = assertCleanTree(root);
  } catch (err) {
    fail(`FAIL release: ${err.message}`);
  }
  console.log(`release tree is clean at ${commit.short}`);

  // 2. Export the commit. Everything below happens in the export, never in the caller's tree.
  step('pristine release tree');
  const tree = await createPristineTree({commit: commit.sha});
  console.log(`exported ${commit.short} to ${tree.dir}`);
  console.log(`  ${commit.subject}`);

  try {
    step('build');
    if (await run('npm', ['run', 'build'], {cwd: tree.dir, label: 'the build'}) !== 0) fail('FAIL release: the build failed');

    step('unit tests');
    if (await run('npm', ['test'], {cwd: tree.dir, label: 'the unit tests', retryOnceOn: INTERRUPTED}) !== 0) fail('FAIL release: the unit tests failed');

    step('law gates');
    if (await run('npm', ['run', 'test:spatial', '--', '--no-build'], {cwd: tree.dir, label: 'the spatial law gates', retryOnceOn: INTERRUPTED}) !== 0) fail('FAIL release: the spatial law gates failed');

    step('deep content audit');
    // The audit fails in two different ways, and they must not be treated alike. A FINDING is
    // a property of the site: it is reproduced on the next run, so it is never retried. An
    // UNMEASURABLE page is the instrument failing — the machine ran out of memory, the
    // browser would not start — and that is worth one more attempt, because a release must
    // not be refused for a condition that a second run will not have. If the second run also
    // cannot measure, the release fails: an audit that did not run is not a clean audit.
    let auditOk=false;
    for(let attempt=1;attempt<=2&&!auditOk;attempt++){
      if(attempt>1)console.log('\n(retrying the deep content audit — the first run could not measure, not the site being wrong)');
      const code=await run('npm',['run','test:deep'],{cwd:tree.dir,label:'the deep content audit'});
      auditOk=code===0;
      if(auditOk)break;
      const verdict=await readAuditVerdict(tree.dir);
      if(verdict.findings>0){
        fail(`FAIL release: the audit found ${verdict.findings} spatial hallucination(s) in the content. That is the site, not the instrument — it is not retried.`);
      }
      if(attempt===2){
        fail(`FAIL release: ${verdict.unmeasurable} page(s) could not be measured after two attempts.`);
      }
    }

    // 3. The built tree must still be the commit.
    step('built tree');
    const built = await assertBuiltTreeMatchesCommit(tree.dir);
    if (!built.ok) {
      fail(`FAIL release: the build changed files the commit does not contain:\n${built.changed.map(p => '  ' + p).join('\n')}`);
    }
    const dirty = !treeState(tree.dir).clean;
    console.log(`built tree equals ${commit.short}${dirty ? ' (build products only)' : ''}`);

    // 4. Upload the measured bytes, naming the production branch explicitly. The uploader runs
    // inside the pristine tree, so the tree it inspects for dirt is the tree it publishes —
    // not the caller's, which another agent may be writing to at this moment.
    step('upload');
    const code = await run('npx', [
      'wrangler', 'pages', 'deploy',
      '--project-name', project,
      '--branch', productionBranch,
      '--commit-hash', commit.sha,
      '--commit-message', commit.subject,
      '--commit-dirty', String(dirty),
    ], {cwd: tree.dir, label: 'the upload', retryOnceOn: INTERRUPTED});
    if (code !== 0) fail('FAIL release: the upload failed');

    // 5. The live site must serve this commit and behave. An uploaded tree that the domain does
    //    not serve is not a release, and a release nobody has opened is an unverified one. The
    //    edge needs a moment to propagate, so wait for the commit, then walk the live pages.
    step('live verification');
    await waitForLiveCommit(commit.short);
    console.log(`the live site serves ${commit.short}`);
    const liveCode = await run('node', ['scripts/live-verify.mjs', liveBase], {cwd: tree.dir, label: 'the live verification', retryOnceOn: INTERRUPTED});
    if (liveCode !== 0) fail(`FAIL release: the live site did not verify at ${liveBase}`);

    console.log(`\nPASS release: ${commit.short} built, measured, uploaded to ${project} (${productionBranch}) and verified live at ${liveBase}.`);
  } finally {
    await tree.remove();
  }
}

try {
  await main();
} catch (err) {
  if (err instanceof ReleaseFailure) {
    console.error(err.message);
    process.exit(1);
  }
  console.error('FAIL release: the release could not be completed');
  console.error(err?.stack || err);
  process.exit(1);
}
