#!/usr/bin/env node
// Refuses to release a build that does not match the commit it claims to be.
//
// `npm run deploy` builds the WORKING TREE and writes that commit into public/version.json.
// If the tree is dirty, the manifest names a commit whose bytes are not what will be served:
// the version, the audit trail and the deployed site all disagree, and nothing detects it.
// A release must be exactly the thing that was reviewed and committed.
//
// This runs first in the deploy chain. It is a gate, not a repair: an agent that must ship
// uncommitted work commits it first.
import {execFileSync} from 'node:child_process';

const git = (...args) => execFileSync('git', args, {encoding: 'utf8'}).trim();

let dirty = [];
let untracked = [];
try {
  dirty = git('status', '--porcelain', '--untracked-files=no')
    .split('\n')
    .filter(Boolean);
  untracked = git('status', '--porcelain')
    .split('\n')
    .filter(line => line.startsWith('??'))
    .map(line => line.slice(3).trim());
} catch {
  console.error('FAIL release: this is not a git repository, so the build cannot name a commit.');
  process.exit(1);
}

// Files that never reach public/ cannot make the served bytes differ from the commit.
const NOT_SHIPPED = [/^public\/version\.json$/, /^public\/js\/geometry\.js$/];

const relevant = dirty.filter(line => {
  const path = line.slice(3).trim();
  return !NOT_SHIPPED.some(re => re.test(path));
});

if (relevant.length || untracked.length) {
  console.error('FAIL release: the working tree is not the commit that would be published.\n');
  for (const line of relevant) console.error(`  changed   ${line.slice(3).trim()}`);
  for (const line of untracked) console.error(`  untracked ${line}`);
  console.error(
    '\nThe build manifest would name a commit whose bytes are not what gets served. ' +
    'Commit the work, or stash it, and release again.'
  );
  process.exit(1);
}

console.log(`release tree is clean at ${git('rev-parse', '--short', 'HEAD')}`);
