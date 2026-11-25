import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, readFile, mkdir, rm, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {acquireReleaseLock, createReleaseReceipt, lockfileIdentity, assetManifest, finishRelease} from '../scripts/lib/release-operations.mjs';
import {createPristineTree} from '../scripts/lib/release-tree.mjs';
import {run} from '../scripts/lib/release-run.mjs';

async function repo() {
  const dir = await mkdtemp(join(tmpdir(), 'carbon-operations-'));
  execFileSync('git', ['init', '-qb', 'main'], {cwd: dir});
  for (const [key, value] of [['user.email', 'test@example.com'], ['user.name', 'Release Test']]) execFileSync('git', ['config', key, value], {cwd: dir});
  await writeFile(join(dir, 'package.json'), '{"name":"isolated-test","version":"1.0.0","private":true}');
  await writeFile(join(dir, 'package-lock.json'), '{"name":"isolated-test","version":"1.0.0","lockfileVersion":3,"packages":{"":{"name":"isolated-test","version":"1.0.0"}}}');
  await mkdir(join(dir, 'public'));
  await writeFile(join(dir, 'public', 'index.html'), 'public fixture');
  execFileSync('git', ['add', '.'], {cwd: dir});
  execFileSync('git', ['commit', '-qm', 'fixture'], {cwd: dir});
  return dir;
}

test('production lock serializes releases, retains owner identity and only its owner removes it', async () => {
  const root = await repo();
  try {
    const first = await acquireReleaseLock(root, 'A');
    assert.equal(first.owner.pid, process.pid);
    assert.ok(Date.parse(first.owner.startedAt));
    await assert.rejects(acquireReleaseLock(root, 'B'), /Another release owns/);
    const ownerPath = join(first.path, 'owner.json');
    await writeFile(ownerPath, JSON.stringify({...first.owner, token: 'other-owner'}));
    await assert.rejects(first.release(), /ownership changed/);
    await writeFile(ownerPath, JSON.stringify(first.owner));
    await first.release();
    const second = await acquireReleaseLock(root, 'B');
    await second.release();
  } finally { await rm(root, {recursive: true, force: true}); }
});

test('receipt and manifest survive pristine cleanup without environment or child output', async () => {
  const root = await repo();
  try {
    const tree = await createPristineTree({cwd: root});
    const evidence = await createReleaseReceipt(root, tree.commit);
    await evidence.recordPhase({label: 'fixture gate', code: 1, durationMs: 8, attempts: 1, stdout: 'SECRET_OUTPUT'});
    await evidence.captureAssets(join(tree.dir, 'public'));
    await tree.remove();
    const saved = await readFile(join(evidence.dir, 'receipt.json'), 'utf8');
    assert.equal(saved.includes('SECRET_OUTPUT'), false);
    assert.equal(saved.includes('CLOUDFLARE_API_TOKEN'), false);
    assert.equal(JSON.parse(saved).phases[0].code, 1);
    assert.equal(JSON.parse(await readFile(join(evidence.dir, 'assets.json'), 'utf8'))[0].path, 'index.html');
  } finally { await rm(root, {recursive: true, force: true}); }
});

test('isolated npm ci uses the candidate lock and not a contaminated caller node_modules', async () => {
  const root = await repo();
  try {
    await mkdir(join(root, 'node_modules'));
    await writeFile(join(root, 'node_modules', 'unlocked.txt'), 'unlocked');
    const tree = await createPristineTree({cwd: root});
    try {
      const before = await lockfileIdentity(tree.dir);
      const code = await run('npm', ['ci', '--include=dev', '--ignore-scripts=false', '--no-audit', '--no-fund'], {cwd: tree.dir});
      assert.equal(code, 0);
      assert.equal(await lockfileIdentity(tree.dir), before);
      await assert.rejects(readFile(join(tree.dir, 'node_modules', 'unlocked.txt')));
      await mkdir(join(tree.dir, 'fixture-dependency'));
      await writeFile(join(tree.dir, 'fixture-dependency', 'package.json'), '{"name":"fixture-dependency","version":"1.0.0"}');
      await writeFile(join(tree.dir, 'package.json'), '{"dependencies":{"fixture-dependency":"file:./fixture-dependency"}}');
      assert.notEqual(await run('npm', ['ci', '--offline', '--no-audit', '--no-fund'], {cwd: tree.dir}), 0, 'mismatched dependency declaration cannot pass install');
    } finally { await tree.remove(); }
  } finally { await rm(root, {recursive: true, force: true}); }
});

test('public manifest refuses symlinks into private paths', async () => {
  const root = await repo();
  try {
    await symlink(join(root, 'package.json'), join(root, 'public', 'private-link'));
    await assert.rejects(assetManifest(join(root, 'public')), /Public symlink/);
  } finally { await rm(root, {recursive: true, force: true}); }
});

test('cleanup failure stays failed, persists the receipt, and still releases owned lock', async () => {
  const root = await repo();
  try {
    const lock = await acquireReleaseLock(root, 'A');
    const evidence = await createReleaseReceipt(root, {sha: 'A', short: 'A'});
    evidence.receipt.status = 'verified';
    const errors = await finishRelease({tree: {remove: async () => { throw new Error('cleanup fixture'); }}, evidence, lock});
    assert.deepEqual(errors, ['worktree cleanup']);
    const receipt = JSON.parse(await readFile(join(evidence.dir, 'receipt.json'), 'utf8'));
    assert.equal(receipt.status, 'failed');
    assert.equal(receipt.cleanupErrors[0], 'worktree cleanup');
    const next = await acquireReleaseLock(root, 'B'); await next.release();
    let released = false;
    assert.deepEqual(await finishRelease({evidence: {receipt: {}, save: async () => { throw new Error('disk fixture'); }}, lock: {release: async () => { released = true; }}}), ['receipt persistence']);
    assert.equal(released, true, 'disk failure cannot strand the release lock');
  } finally { await rm(root, {recursive: true, force: true}); }
});

test('diagnostic reports survive cleanup with credentials redacted and unrelated files excluded', async () => {
 const root=await repo();
 try{
  const evidence=await createReleaseReceipt(root,{short:'test',sha:'a'.repeat(40)});
  const tree=join(root,'export');await mkdir(join(tree,'test-results','spatial'),{recursive:true});
  await writeFile(join(tree,'test-results','spatial','deep-report.json'),JSON.stringify({report:[{offenders:['#visible'],secret:'do-not-publish',url:'https://example.org/?token=private'}]}));
  await writeFile(join(tree,'test-results','private-project.json'),'private');
  await evidence.captureDiagnostics(tree);
  const text=await readFile(join(evidence.dir,'diagnostics','spatial','deep-report.json'),'utf8');
  assert.ok(text.includes('#visible'));assert.ok(!text.includes('do-not-publish'));assert.ok(!text.includes('token=private'));
  assert.equal(evidence.receipt.diagnostics.length,1);
 }finally{await rm(root,{recursive:true,force:true});}
});
