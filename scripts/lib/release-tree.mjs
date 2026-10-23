// The tree a release is built from.
//
// A release must be exactly the commit it names. The obvious way to arrange that is to check
// the working tree for dirt and then build it — and that is wrong in two ways that were both
// observed on this machine.
//
//   1. Time of check, time of use. The check runs, then the build copies files. If anything
//      writes to the tree in between, the published bytes are NOT the commit's, while
//      /version.json still names the commit. A release went out that way: the manifest said
//      3901f15 and the served CSS was another agent's uncommitted work.
//
//   2. The tree is shared. This repository is worked on by more than one agent at the same
//      time, on the same checkout. "The tree was clean when I looked" is not a property of the
//      tree, it is a moment in time.
//
// So the release does not build the tree it was invoked in. It exports the commit into a
// pristine worktree — a separate checkout at that exact commit, with no shared mutable state
// — builds there, measures there, and uploads from there. A write to the caller's tree during
// the release cannot reach the published bytes, because the published bytes were never read
// from the caller's tree.
import {execFileSync, execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp, symlink, rm, readdir, stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const exec = promisify(execFile);

/** The root of this repository, whichever directory the command was launched from. */
export function repoRoot() {
  // scripts/lib/release-tree.mjs -> scripts -> the repository root
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
}

const git = (args, cwd) =>
  execFileSync('git', args, {encoding: 'utf8', cwd: cwd ?? repoRoot()}).trim();

/** The commit the caller is releasing: full sha, short sha and subject. */
export function headCommit(cwd) {
  const root = cwd ?? repoRoot();
  return {
    sha: git(['rev-parse', 'HEAD'], root),
    short: git(['rev-parse', '--short', 'HEAD'], root),
    subject: git(['log', '-1', '--pretty=%s'], root),
  };
}

// Files that never reach public/ cannot make the served bytes differ from the commit.
const NOT_SHIPPED = [/^public\/version\.json$/, /^public\/js\/geometry\.js$/];

// The release links node_modules into the exported tree. It is a harness artefact of the
// export, never a published file, and in a scratch repository it is not gitignored.
const isHarnessArtefact = path => path === 'node_modules' || path.startsWith('node_modules/');

/**
 * What is not committed in this tree. Returns the changed and untracked paths.
 * @param {string} [cwd]
 */
export function treeState(cwd) {
  const root = cwd ?? repoRoot();
  const lines = git(['status', '--porcelain'], root).split('\n').filter(Boolean);
  const changed = [];
  const untracked = [];
  for (const line of lines) {
    const path = line.slice(3).trim();
    if (line.startsWith('??')) {
      if (!isHarnessArtefact(path)) untracked.push(path);
    } else if (!NOT_SHIPPED.some(re => re.test(path))) changed.push(path);
  }
  return {changed, untracked, clean: changed.length === 0 && untracked.length === 0};
}

/**
 * Refuse to release a build that does not match the commit it claims to be.
 * Throws with an actionable message rather than exiting, so the release script can use it
 * as a step and a human can run it as a command.
 * @param {string} [cwd]
 */
export function assertCleanTree(cwd) {
  const root = cwd ?? repoRoot();
  let state;
  try {
    state = treeState(root);
  } catch {
    throw new Error('this is not a git repository, so the build cannot name a commit');
  }
  if (!state.clean) {
    const lines = [
      'the working tree is not the commit that would be published.',
      ...state.changed.map(p => `  changed   ${p}`),
      ...state.untracked.map(p => `  untracked ${p}`),
      '',
      'The build manifest would name a commit whose bytes are not what gets served. ' +
        'Commit the work, or stash it, and release again.',
    ];
    throw new Error(lines.join('\n'));
  }
  return headCommit(root);
}

/**
 * Export a commit into a pristine worktree and build-ready directory.
 *
 * The worktree is a real checkout (it carries its own .git file), so the build script can
 * still ask git which commit it is building. node_modules is linked in rather than installed
 * again: the dependency set is the same tree's, and a release must not silently install a
 * different one.
 *
 * @param {{commit?:string, cwd?:string}} [opts]
 * @returns {Promise<{dir:string, commit:object, remove:() => Promise<void>}>}
 */
export async function createPristineTree({commit, cwd} = {}) {
  const root = cwd ?? repoRoot();
  const target = commit ? headCommit(root) : headCommit(root);
  const parent = await mkdtemp(join(tmpdir(), 'carbon-release-'));
  const dir = join(parent, 'tree');
  await exec('git', ['worktree', 'add', '--detach', dir, target.sha], {cwd: root});

  const modules = join(root, 'node_modules');
  if (!existsSync(modules)) {
    await rm(parent, {recursive: true, force: true});
    throw new Error('node_modules is missing in the calling tree; run npm ci first');
  }
  await symlink(modules, join(dir, 'node_modules'), 'dir');

  return {
    dir,
    commit: target,
    async remove() {
      try {
        await exec('git', ['worktree', 'remove', '--force', dir], {cwd: root});
      } catch {
        // The worktree may already be gone; the temp directory still has to go.
      }
      await rm(parent, {recursive: true, force: true});
    },
  };
}

/**
 * Confirm that the built tree still equals the commit it was exported from.
 *
 * Two build products are allowed to differ from the commit: the manifest (it carries the
 * build time) and the bundled geometry module. Everything else must be byte-identical, or
 * the release is publishing something the commit does not contain.
 *
 * @param {string} dir the pristine tree
 * @returns {Promise<{ok:boolean, changed:string[]}>}
 */
export async function assertBuiltTreeMatchesCommit(dir) {
  const {stdout} = await exec('git', ['status', '--porcelain'], {cwd: dir});
  const changed = stdout
    .split('\n')
    .filter(Boolean)
    .map(line => line.slice(3).trim())
    .filter(path => !NOT_SHIPPED.some(re => re.test(path)))
    .filter(path => !isHarnessArtefact(path));
  return {ok: changed.length === 0, changed};
}

export {exec};
