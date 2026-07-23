# R3 Checkpoint — live-CI remediation round 2

Two fixes for the findings from the live GitHub Actions runs. Work done only
on `dev`; `main` untouched; nothing pushed. Exactly the two findings; no other
changes.

## What was fixed

1. **Changed-paths guard crashes on shallow checkout / bad before SHA.**
   Both workflows already fetch full history (`actions/checkout` with
   `fetch-depth: 0`); the guard itself is now crash-proof:
   - A missing OR all-zero `github.event.before` SHA (first push of a branch,
     force push) diffs against the empty tree
     (`4b825dc642cb6eb9a060e54bf8d69288fbee4904`) so every file in the push
     counts as changed, with a logged notice.
   - The guard runs under `set -uo pipefail` (no `-e`) and captures
     `git diff` output with `2>&1` under an `if !` test: ANY git error
     (shallow history, unresolvable SHA, etc.) resolves to the safe default
     with a logged notice — `ci.yml` treats the push as NOT content-only
     (the full battery RUNS) and `content.yml` SKIPS its validate-only
     bypass. The guard can never fail the job on its own mechanics; the two
     lanes stay mutually exclusive because both default the same way.
   - `tests/run-t11.sh` assertions updated for the new mechanics: both
     workflows must embed `fetch-depth: 0`, the zero-SHA/empty-tree handling,
     the `2>&1` error capture, a logged `notice`, and the
     `defaulting to NOT content-only` safe-default path.

2. **Lighthouse perf variance on shared runners.** Thresholds and the mobile
   preset are UNCHANGED. `lighthouserc.cjs` now reads `LHCI_CI`: when
   `LHCI_CI=1` (set only on the `test:t10` step in `ci.yml`), collection uses
   `numberOfRuns: 5` (median-of-5, a stricter sample count to absorb runner
   noise — same thresholds) and adds `--no-sandbox` to `chromeFlags` (CI
   runners disallow Chromium's user-namespace sandbox). Locally nothing is
   set, so local runs stay median-of-3 with the sandbox enabled.

## Acceptance results

- `npm run test:t11` — PASS (updated guard-mechanics assertions)
- `TZ=UTC npm run test:t4` — PASS
- `TZ=America/Chicago npm run test:t4` — PASS
- `npm run build` — PASS (16 pages)
- `npm run test:t10` — PASS locally (median-of-3; CI uses median-of-5, same thresholds)

Committed as `R3: CI guard depth + LH median-of-5 on runners` with this
checkpoint and `R3-REMEDIATION.md`; status clean after. DO NOT PUSH — the
reviewer pushes and re-proves on the live runners.
