# R3 — Live-CI remediation round 2 (two findings). Work ONLY on dev. DO NOT PUSH. Fix exactly these.

1. **Changed-paths guard crashes on shallow checkout.** Both workflows' guard steps: set
   `actions/checkout` `fetch-depth: 0`, and make the guard tolerate a missing/zero `before` SHA
   (first push / force push: treat as NOT content-only in ci.yml — run the battery — and SKIP in
   content.yml). The guard must never fail the job on its own mechanics: any git error path
   resolves to the safe default (battery runs, bypass skips) with a logged notice.
2. **Lighthouse perf variance on shared runners.** Do NOT change thresholds or the mobile preset.
   In CI only (env var consumed by lighthouserc.cjs): numberOfRuns=5 (median-of-5) and pass
   `--no-sandbox` chrome flags if needed for the runner. Locally stays median-of-3. Document in
   the checkpoint that CI uses a stricter sample count, same thresholds.

Acceptance: test:t11 (update its assertions for the new guard mechanics), test:t4 both TZs,
build, test:t10 locally all exit 0. Commit `R3: CI guard depth + LH median-of-5 on runners` with
R3-CHECKPOINT.md and this file; status clean. DO NOT PUSH.
