#!/usr/bin/env node
// Refuses to release a build that does not match the commit it claims to be.
//
// `npm run deploy` builds the WORKING TREE and writes that commit into public/version.json.
// If the tree is dirty, the manifest names a commit whose bytes are not what will be served:
// the version, the audit trail and the deployed site all disagree, and nothing detects it.
//
// The real defence is stronger than this check: `npm run deploy` exports the commit into a
// pristine worktree and builds there (see scripts/release.mjs), so a concurrent write cannot
// reach the published bytes either. This command remains the fast, human-readable answer to
// "would a release ship my uncommitted work?" — and it is the same check the release runs.
import {assertCleanTree} from './release-tree.mjs';

try {
  const commit = assertCleanTree();
  console.log(`release tree is clean at ${commit.short}`);
} catch (err) {
  console.error(`FAIL release: ${err.message}`);
  process.exit(1);
}
