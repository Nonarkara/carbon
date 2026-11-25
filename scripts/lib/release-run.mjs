// Running a command as part of a release, and telling an interruption from a failure.
//
// A release runs its gates in a child process. On a shared machine, another agent's script can
// send a signal to that child — the test runner then reports the files it never reached as a
// failure. That is the machine, not the site: the tests that did run passed, and the ones that
// never started were never wrong.
//
// So the runner distinguishes the two. A run that was interrupted is retried once. A run that
// failed is not retried: a real failure is a real failure, and retrying it would only hide it.
// Two interruptions are still a failure — the machine does not get to veto the release forever.
import {spawn} from 'node:child_process';

// What Node's test runner prints when it is stopped by a signal rather than by a failing test.
export const INTERRUPTED = /Interrupted while running/;

// Pre-upload gates must measure the pristine tree, never an inherited live/test URL.
export function localReleaseEnv(env = process.env) {
  const local = {...env};
  delete local.BASE_URL;
  return local;
}

/**
 * Run a command, printing its output and returning its exit code.
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {{cwd?:string, label?:string, retryOnceOn?:RegExp|null, maxBuffer?:number, env?:NodeJS.ProcessEnv, signal?:AbortSignal, onResult?:Function}} [options]
 * @returns {Promise<number>} the exit code, 0 for success
 */
export async function run(cmd, args, {cwd = process.cwd(), label, retryOnceOn = null, maxBuffer = 64 * 1024 * 1024, env = process.env, signal, onResult} = {}) {
  const name = label ?? `${cmd} ${args.join(' ')}`;
  const started = Date.now();
  const finish = async (code, attempts) => {
    await onResult?.({label: name, code, attempts, durationMs: Date.now() - started, cancelled: Boolean(signal?.aborted)});
    return code;
  };
  for (let attempt = 1; attempt <= (retryOnceOn ? 2 : 1); attempt++) {
    try {
      if (signal?.aborted) return finish(130, attempt - 1);
      const {stdout, stderr} = await execOwned(cmd, args, {cwd, maxBuffer, env, signal});
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
      return finish(0, attempt);
    } catch (err) {
      const output = `${err.stdout || ''}${err.stderr || ''}`;
      if (output) process.stdout.write(output);
      if (!signal?.aborted && retryOnceOn && attempt === 1 && retryOnceOn.test(output)) {
        console.error(`\n(retrying ${name} — the run was interrupted, not a verdict)`);
        await new Promise(r => setTimeout(r, 100));
        continue;
      }
      console.error(`\nFAIL release: ${name} failed`);
      return finish(signal?.aborted ? 130 : (Number.isInteger(err.code) ? err.code : 1), attempt);
    }
  }
  return 1;
}

// A dedicated process group scopes cancellation to this release's own descendants.
// SIGKILL is delayed and only targets that owned group; unrelated machine runners survive.
export function execOwned(cmd, args, {cwd, env, maxBuffer = 64 * 1024 * 1024, signal} = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(Object.assign(new Error('Release cancelled'), {code: 130}));
    const grouped = process.platform !== 'win32';
    const child = spawn(cmd, args, {cwd, env, detached: grouped, stdio: ['ignore', 'pipe', 'pipe']});
    let stdout = '', stderr = '', length = 0, escalation, overflow = false;
    const send = sig => {
      if (!child.pid) return;
      try { grouped ? process.kill(-child.pid, sig) : child.kill(sig); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    };
    const stop = () => {
      send('SIGTERM');
      escalation ??= setTimeout(() => send('SIGKILL'), 2000);
      escalation.unref();
    };
    const collect = (chunk, stream) => {
      length += chunk.length;
      if (length > maxBuffer) { overflow = true; stop(); return; }
      if (stream === 'out') stdout += chunk.toString(); else stderr += chunk.toString();
    };
    child.stdout.on('data', data => collect(data, 'out'));
    child.stderr.on('data', data => collect(data, 'err'));
    signal?.addEventListener('abort', stop, {once: true});
    const cleanup = () => { signal?.removeEventListener('abort', stop); clearTimeout(escalation); };
    child.once('error', error => { cleanup(); reject(error); });
    child.once('close', (code, childSignal) => {
      cleanup();
      if (code === 0 && !signal?.aborted && !overflow) resolve({stdout, stderr});
      else reject(Object.assign(new Error(overflow ? 'Release child output exceeded bound' : `Release child exited (${code ?? childSignal})`), {code: signal?.aborted ? 130 : (code || 1), stdout, stderr}));
    });
  });
}
