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
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const exec = promisify(execFile);

// What Node's test runner prints when it is stopped by a signal rather than by a failing test.
export const INTERRUPTED = /Interrupted while running/;

/**
 * Run a command, printing its output and returning its exit code.
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {{cwd?:string, label?:string, retryOnceOn?:RegExp|null, maxBuffer?:number}} [options]
 * @returns {Promise<number>} the exit code, 0 for success
 */
export async function run(cmd, args, {cwd = process.cwd(), label, retryOnceOn = null, maxBuffer = 64 * 1024 * 1024} = {}) {
  const name = label ?? `${cmd} ${args.join(' ')}`;
  for (let attempt = 1; attempt <= (retryOnceOn ? 2 : 1); attempt++) {
    try {
      const {stdout, stderr} = await exec(cmd, args, {cwd, maxBuffer});
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
      return 0;
    } catch (err) {
      const output = `${err.stdout || ''}${err.stderr || ''}`;
      if (output) process.stdout.write(output);
      if (retryOnceOn && attempt === 1 && retryOnceOn.test(output)) {
        console.error(`\n(retrying ${name} — the run was interrupted, not a verdict)`);
        await new Promise(r => setTimeout(r, 100));
        continue;
      }
      console.error(`\nFAIL release: ${name} failed`);
      return err.code ?? 1;
    }
  }
  return 1;
}
