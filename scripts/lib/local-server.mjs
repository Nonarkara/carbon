// Starts this project's own server for a measurement, on a port nobody else holds.
//
// The law's instrument has to be runnable as ONE command by anyone, at any time, on any
// machine. Two things stopped that:
//
//   1. The gates defaulted to hardcoded ports (8788 and 8801, inconsistently) and expected a
//      server that a human had already started. On a machine where another app already held
//      8788, `npm run test:spatial` died with "the server at ... is not this project" — the
//      identity guard working correctly, but the command was measuring the wrong thing by
//      construction rather than by mistake.
//   2. A gate run against an unknown server is a measurement of whatever that server is.
//
// So the measurement starts its own server, on an ephemeral port, proves it is THIS build by
// reading the manifest it publishes, and stops it afterwards. Nothing to start by hand,
// nothing to forget, and no way to point the law at a stranger's app.
//
// If BASE_URL is set, the caller has a server on purpose (a live release, a CI service) and
// this helper stays out of the way.
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {resolve} from 'node:path';

/** An unused TCP port on the loopback interface. */
export function freePort() {
  return new Promise((resolvePort, rejectPort) => {
    const probe = createServer();
    probe.unref();
    probe.on('error', rejectPort);
    probe.listen(0, '127.0.0.1', () => {
      const {port} = probe.address();
      probe.close(() => resolvePort(port));
    });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Start dev-server.mjs for this repository and wait until it answers with a build manifest.
 *
 * @param {{cwd?:string}} [opts]
 * @returns {Promise<{base:string,port:number,commit:string,stop:()=>Promise<void>}>}
 */
export async function startLocalServer({cwd = process.cwd()} = {}) {
  // A free port is chosen by binding one and letting go of it, so there is a window in which
  // another process can take it. On a busy machine that happens, and a server that cannot bind
  // never answers. Rather than fail the whole measurement on a lost race, the port is chosen
  // again and the server started again — up to three attempts.
  const ATTEMPTS = 3;
  let lastError = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      return await startServerOnFreePort({cwd});
    } catch (err) {
      lastError = err;
      if (attempt < ATTEMPTS) console.error(`  (local server attempt ${attempt} failed: ${err.message} — retrying on another port)`);
    }
  }
  throw lastError;
}

async function startServerOnFreePort({cwd}) {
  const port = await freePort();
  const child = spawn(process.execPath, [resolve(cwd, 'dev-server.mjs')], {
    cwd,
    env: {...process.env, PORT: String(port)},
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // The child's handle must not keep the parent's event loop alive. Without this, a gate that
  // starts its own server and then finishes its work never exits: it waits for a server it
  // started, and the server waits for the gate. The child is reaped on exit below.
  child.unref();
  // The pipes are read for diagnostics, so they are unref'd too — an attached listener on a
  // piped stdio stream holds the event loop open just as firmly as the process handle.
  child.stdout?.unref();
  child.stderr?.unref();

  let stderr = '';
  child.stderr.on('data', d => {
    stderr += d.toString();
  });
  // A server that died must not leave the measurement hanging on a port that never answers.
  let exited = false;
  child.on('exit', () => {
    exited = true;
  });

  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 30000;
  let manifest = null;
  while (Date.now() < deadline) {
    if (exited) {
      throw new Error(`the local server exited before it answered${stderr ? `: ${stderr.trim()}` : ''}`);
    }
    try {
      const res = await fetch(`${base}/version.json`, {signal: AbortSignal.timeout(2000)});
      if (res.ok) {
        const body = await res.json();
        if (typeof body?.commit === 'string' && body.commit) {
          manifest = body;
          break;
        }
      }
    } catch {
      // Not up yet.
    }
    await sleep(150);
  }
  if (!manifest) {
    child.kill('SIGKILL');
    throw new Error(
      `the local server did not publish a build manifest at ${base}/version.json within 30s. ` +
      'Build the site first: npm run build'
    );
  }

  const stop = async () => {
    if (exited) return;
    child.kill('SIGTERM');
    const gone = await Promise.race([
      new Promise(r => child.on('exit', () => r(true))),
      sleep(3000).then(() => false),
    ]);
    if (!gone) child.kill('SIGKILL');
  };

  // A gate that fails mid-measurement throws, and the process exits. The server it started
  // must not outlive it and hold a port. This reaps it on every exit path.
  const reap = () => {
    try {
      if (!exited) child.kill('SIGKILL');
    } catch {
      // The child is already gone.
    }
  };
  process.on('exit', reap);
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
    reap();
    process.exit(signal === 'SIGINT' ? 130 : 143);
  });

  return {base, port, commit: manifest.commit, stop};
}

/**
 * The base URL a measurement should use, and a stop function that is safe to call either way.
 *
 * @param {{cwd?:string}} [opts]
 * @returns {Promise<{base:string,commit:string|null,stop:()=>Promise<void>}>}
 */
export async function measurementTarget({cwd = process.cwd()} = {}) {
  const explicit = process.env.BASE_URL;
  if (explicit) {
    return {base: explicit.replace(/\/+$/, ''), commit: null, stop: async () => {}};
  }
  const server = await startLocalServer({cwd});
  return {base: server.base, commit: server.commit, stop: server.stop};
}
