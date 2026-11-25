// Release-owned state lives in git metadata, never in public/ or a disposable checkout.
import {execFileSync} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';
import {mkdir, readFile, writeFile, rm, readdir, rename} from 'node:fs/promises';
import {resolve, join} from 'node:path';

export function releaseStateRoot(root) {
  const common = execFileSync('git', ['rev-parse', '--git-common-dir'], {cwd: root, encoding: 'utf8'}).trim();
  return resolve(root, common, 'carbon-release');
}

export async function acquireReleaseLock(root, commit) {
  const base = releaseStateRoot(root);
  await mkdir(base, {recursive: true});
  const path = join(base, 'production.lock');
  const owner = {pid: process.pid, startedAt: new Date().toISOString(), commit, token: randomUUID()};
  try {
    await mkdir(path);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const previous = await readFile(join(path, 'owner.json'), 'utf8').then(JSON.parse).catch(() => null);
    throw new Error(`Another release owns ${path}${previous ? ` (PID ${previous.pid}, started ${previous.startedAt}, commit ${previous.commit})` : ' (owner is being recorded or needs inspection)'}. Do not remove it until that exact process is confirmed stopped.`);
  }
  try {
    await writeFile(join(path, 'owner.json'), JSON.stringify(owner) + '\n', {mode: 0o600});
  } catch (error) {
    await rm(path, {recursive: true, force: true});
    throw error;
  }
  return {owner, path, async release() {
    const current = await readFile(join(path, 'owner.json'), 'utf8').then(JSON.parse).catch(() => null);
    if (!current || current.token !== owner.token) throw new Error('Release lock ownership changed; refusing to remove another owner’s lock');
    await rm(path, {recursive: true});
  }};
}

export async function lockfileIdentity(dir) {
  return createHash('sha256').update(await readFile(join(dir, 'package-lock.json'))).digest('hex');
}

export async function assetManifest(dir) {
  const entries = [];
  async function walk(relative) {
    for (const entry of await readdir(join(dir, relative), {withFileTypes: true})) {
      const path = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Public symlink is not a release artifact: ${path}`);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) {
        const bytes = await readFile(join(dir, path));
        entries.push({path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')});
      }
    }
  }
  await walk('');
  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

// Only explicitly supplied operational fields are written. Never capture env, command
// output, authentication headers or imported project files in the durable receipt.
export async function createReleaseReceipt(root, commit) {
  const id = `${new Date().toISOString().replace(/[:.]/g, '-')}-${commit.short}-${randomUUID().slice(0, 8)}`;
  const dir = join(releaseStateRoot(root), 'receipts', id);
  await mkdir(dir, {recursive: true, mode: 0o700});
  const receipt = {schemaVersion: 1, commit, startedAt: new Date().toISOString(), node: process.version, platform: process.platform, status: 'running', phases: [], domains: [], cleanup: 'pending'};
  const save = async () => {
    await writeFile(join(dir, 'receipt.tmp'), JSON.stringify(receipt, null, 2) + '\n', {mode: 0o600});
    await rename(join(dir, 'receipt.tmp'), join(dir, 'receipt.json'));
  };
  await save();
  return {dir, receipt, save, async captureDiagnostics(treeDir) {
    const files = ['spatial/deep-report.json','spatial/summary.json','browser-summary.json','ship-summary.json','workspace/summary.json','accessibility.json','session-summary.json','data-recovery-summary.json'];
    receipt.diagnostics = [];
    for (const file of files) {
      let raw;try { raw = await readFile(join(treeDir, 'test-results', file), 'utf8'); } catch { continue; }
      if (Buffer.byteLength(raw) > 8 * 1024 * 1024) { receipt.diagnostics.push({file,status:'omitted: size bound'});continue; }
      const safe = JSON.stringify(JSON.parse(raw), (key,value) => /token|password|secret|authorization|cookie/i.test(key) ? '[redacted]' : typeof value === 'string' ? value.replace(/Bearer\s+[^\s]+/gi, 'Bearer [redacted]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email redacted]').replace(/([?&](?:key|token|api_key|authorization)=)[^&\s]+/gi, '$1[redacted]') : value, 2);
      const target = join(dir, 'diagnostics', file);await mkdir(resolve(target, '..'), {recursive:true});await writeFile(target, safe+'\n', {mode:0o600});
      receipt.diagnostics.push({file,status:'retained'});
    }
    await save();
  }, async recordPhase({label, code, durationMs, attempts, cancelled = false}) {
    receipt.phases.push({label, code, durationMs, attempts, cancelled});
    await save();
  }, async captureAssets(publicDir) {
    const manifest = await assetManifest(publicDir);
    await writeFile(join(dir, 'assets.json'), JSON.stringify(manifest, null, 2) + '\n', {mode: 0o600});
    receipt.assetCount = manifest.length;
    await save();
  }};
}

// Cleanup attempts every owned resource even when one operation fails. Return names rather
// than exception bodies: an OS/npm exception may contain credentials or private paths.
export async function finishRelease({tree, evidence, lock}) {
  const errors = [];
  try { if (tree && evidence?.captureDiagnostics) await evidence.captureDiagnostics(tree.dir); } catch { errors.push('diagnostic preservation'); }
  try { if (tree) await tree.remove(); } catch { errors.push('worktree cleanup'); }
  if (evidence) {
    evidence.receipt.cleanup = errors.length ? 'failed; inspect owned worktree in git worktree list' : 'complete';
    if (errors.length) evidence.receipt.status = 'failed';
    evidence.receipt.finishedAt = new Date().toISOString();
    try { await evidence.save(); } catch { errors.push('receipt persistence'); }
  }
  try { if (lock) await lock.release(); } catch { errors.push('lock ownership release'); }
  if (errors.length && evidence) {
    evidence.receipt.status = 'failed';
    evidence.receipt.cleanupErrors = errors;
    try { await evidence.save(); } catch {}
  }
  return errors;
}
