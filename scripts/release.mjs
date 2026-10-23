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
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {assertCleanTree, createPristineTree, assertBuiltTreeMatchesCommit, headCommit, repoRoot, treeState} from './lib/release-tree.mjs';

const exec = promisify(execFile);
const root = repoRoot();

const project = process.env.CLOUDFLARE_PROJECT || 'forest-carbon-thailand';
const productionBranch = process.env.CLOUDFLARE_BRANCH || 'main';

function step(name) {
  console.log(`\n--- ${name} ---`);
}

async function run(cmd, args, {cwd = root, label} = {}) {
  try {
    const {stdout, stderr} = await exec(cmd, args, {cwd, maxBuffer: 64 * 1024 * 1024});
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    return 0;
  } catch (err) {
    if (err.stdout) process.stdout.write(err.stdout);
    if (err.stderr) process.stderr.write(err.stderr);
    console.error(`\nFAIL release: ${label ?? `${cmd} ${args.join(' ')}`} failed`);
    return err.code ?? 1;
  }
}

async function main() {
  // 1. The tree the command was launched in must be clean.
  step('release tree');
  let commit;
  try {
    commit = assertCleanTree(root);
  } catch (err) {
    console.error(`FAIL release: ${err.message}`);
    process.exit(1);
  }
  console.log(`release tree is clean at ${commit.short}`);

  // 2. Export the commit. Everything below happens in the export, never in the caller's tree.
  step('pristine release tree');
  const tree = await createPristineTree({commit: commit.sha});
  console.log(`exported ${commit.short} to ${tree.dir}`);
  console.log(`  ${commit.subject}`);

  try {
    step('build');
    if (await run('npm', ['run', 'build'], {cwd: tree.dir, label: 'the build'}) !== 0) process.exit(1);

    step('unit tests');
    if (await run('npm', ['test'], {cwd: tree.dir, label: 'the unit tests'}) !== 0) process.exit(1);

    step('law gates');
    if (await run('npm', ['run', 'test:spatial', '--', '--no-build'], {cwd: tree.dir, label: 'the spatial law gates'}) !== 0) process.exit(1);

    step('deep content audit');
    if (await run('npm', ['run', 'test:deep'], {cwd: tree.dir, label: 'the deep content audit'}) !== 0) process.exit(1);

    // 3. The built tree must still be the commit.
    step('built tree');
    const built = await assertBuiltTreeMatchesCommit(tree.dir);
    if (!built.ok) {
      console.error('FAIL release: the build changed files the commit does not contain:');
      for (const path of built.changed) console.error(`  ${path}`);
      process.exit(1);
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
    ], {cwd: tree.dir, label: 'the upload'});
    if (code !== 0) process.exit(code);

    console.log(`\nPASS release: ${commit.short} built, measured and uploaded to ${project} (${productionBranch}).`);
  } finally {
    await tree.remove();
  }
}

await main();
