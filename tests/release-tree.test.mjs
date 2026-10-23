// The release must publish the commit, not whatever the working tree happened to contain.
//
// This test reproduces the failure that shipped once: the tree was checked for dirt, then
// the build copied it, and between those two moments another agent wrote a file. The
// manifest named one commit and the served bytes were another agent's uncommitted work.
//
// The fix is structural — the release exports the commit into a pristine worktree and builds
// there — so the property under test is direct: a pristine tree holds the committed bytes
// even when the working tree it came from has since changed, and a tree that no longer
// matches its commit is refused.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createPristineTree, assertBuiltTreeMatchesCommit} from '../scripts/lib/release-tree.mjs';

const git = (root, ...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();

async function scratchRepo() {
  const root = await mkdtemp(join(tmpdir(), 'carbon-release-test-'));
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'release-test@example.com');
  git(root, 'config', 'user.name', 'Release Test');
  await writeFile(join(root, 'committed.txt'), 'the committed truth\n');
  await mkdir(join(root, 'node_modules'), {recursive: true});
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'the commit under test');
  return root;
}

test('a pristine release tree holds the commit even when the working tree changes', async () => {
  const root = await scratchRepo();
  try {
    // What another agent's edit looks like: a tracked file changed, a new file uncommitted.
    await writeFile(join(root, 'committed.txt'), 'a later, uncommitted edit\n');
    await writeFile(join(root, 'untracked.txt'), 'never committed\n');

    const tree = await createPristineTree({cwd: root});
    try {
      const published = await readFile(join(tree.dir, 'committed.txt'), 'utf8');
      assert.equal(published, 'the committed truth\n', 'the release tree must hold the committed bytes');
      assert.equal(existsSync(join(tree.dir, 'untracked.txt')), false, 'uncommitted work must not reach the release');
      assert.equal(tree.commit.short, git(root, 'rev-parse', '--short', 'HEAD'));
    } finally {
      await tree.remove();
    }
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test('a built tree that no longer matches its commit is refused', async () => {
  const root = await scratchRepo();
  try {
    const tree = await createPristineTree({cwd: root});
    try {
      const before = await assertBuiltTreeMatchesCommit(tree.dir);
      assert.equal(before.ok, true, 'an untouched export matches its commit');

      await writeFile(join(tree.dir, 'committed.txt'), 'changed after the export\n');
      const after = await assertBuiltTreeMatchesCommit(tree.dir);
      assert.equal(after.ok, false, 'a changed file must be reported');
      assert.deepEqual(after.changed, ['committed.txt']);
    } finally {
      await tree.remove();
    }
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test('the release names the production branch explicitly', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts.deploy, 'node scripts/release.mjs', 'the release goes through scripts/release.mjs');

  const script = await readFile(new URL('../scripts/release.mjs', import.meta.url), 'utf8');
  assert.match(script, /'--branch', productionBranch/, 'the upload must name the production branch');
  assert.match(script, /assertBuiltTreeMatchesCommit/, 'the release must check the built tree against the commit');
});
