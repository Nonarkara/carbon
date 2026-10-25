# A release that was killed is not a verdict

Found: a release stopped at the unit tests with "FAIL release: the unit tests failed", and the
evidence was not a failure at all. The runner printed "Interrupted while running:" and then
listed the eleven test files it never reached — the tests that had run had all passed. Another
agent's test suite was on the same machine at the time, and a signal sent to the shared box's
test runners reached the release's runner as well. The release was killed by the machine, and
reported the machine's condition as a verdict on the site.

Changed: the release now tells an interruption from a failure. A run whose output contains
"Interrupted while running" is retried once; a run that fails is not retried, because a real
failure is a real failure and retrying it would only hide it. Two interruptions are still a
failure — the machine does not get to veto a release forever. The rule lives in
scripts/lib/release-run.mjs and is proved by tests/release-run.test.mjs, which counts the
child's own attempts: one attempt for a real failure, two for an interruption, two for a double
interruption, and zero for a success. The unit tests and the law gates use it; the deep audit
already had its own retry for the same reason.

Verified: five tests, each proving one half of the distinction. The helper that is tested is the
helper the release calls — the inline runner was removed rather than kept beside it. The
interruption was reproduced from the inside: a run of the new test file was itself killed by
SIGTERM while the machine was busy, and passed on the retry.

Remaining: the retry covers the two gates that run as child processes. The upload and the live
verification do not have one, because a signal there is not a verdict either — the upload is
idempotent and the live verification is read-only, so a repeat would be safe. The house's rule
that a release must not be killed by a condition outside the site is now only half-applied.
