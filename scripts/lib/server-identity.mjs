// Proves the server being measured is THIS project before anything is measured.
//
// On 2026-10-23 the spatial gate was pointed at port 8788, which was no longer this app: it
// answered 401 and served something else entirely. The gate did not report "wrong server" —
// it reported a missing element and looked like a layout failure. Measuring another project's
// pages and calling the result a finding is worse than not measuring at all.
//
// This project publishes a build manifest at /version.json, written by scripts/build.mjs with
// the commit that was built. That manifest is the identity of the thing under measurement.

/**
 * @param {string} base e.g. http://127.0.0.1:8801
 * @returns {Promise<{version:string,commit:string,builtAt?:string}>}
 */
export async function assertProjectServer(base) {
  const root = String(base).replace(/\/+$/, '');
  const url = `${root}/version.json`;
  let manifest = null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) manifest = await res.json();
  } catch {
    manifest = null;
  }
  if (!manifest || typeof manifest.commit !== 'string' || !manifest.commit) {
    throw new Error(
      `the server at ${root} is not this project: ${url} did not return a build manifest with a commit. ` +
      'Measure a build of this repository. Another app holding the port will report findings that are not about this interface.'
    );
  }
  return manifest;
}
