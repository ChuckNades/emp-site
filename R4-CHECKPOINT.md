# R4 Checkpoint — CI round 3 fixes

Three fixes from the live GitHub Actions runs. Work done only on `dev`;
`main` untouched; nothing pushed. Exactly the three findings; no other
changes.

## What was fixed

1. **content.yml guard exit semantics.** A skip is now SUCCESS: when the push
   is not content-only, the changed-paths guard prints its notice and
   `exit 0` after writing `content_only=false` to `$GITHUB_OUTPUT`; every
   subsequent step (setup-node, install, build, test:t2) is gated on
   `if: steps.gate.outputs.content_only == 'true'`, so a skipped bypass run
   completes green having executed nothing. The guard run block contains no
   nonzero exit at all. Mirror-checked `ci.yml`'s inverse guard: same
   success-on-skip semantics — it writes `content_only=true` and exits 0 on a
   content-only push, with every battery step gated on
   `if: steps.gate.outputs.content_only == 'false'`. The two lanes stay
   mutually exclusive by commit. `tests/run-t11.sh` assertions updated: both
   workflows must embed the `content_only` output writes, the `$GITHUB_OUTPUT`
   mechanics, the per-step `if:` gating ( polarity-checked per lane), and the
   guard run blocks must contain `exit 0` and no `exit [1-9]`.

2. **CI Lighthouse sample count wired for real.** `lighthouserc.cjs` now reads
   `LHCI_RUNS` (default 3) for `numberOfRuns` instead of hardcoding
   `isCI ? 5 : 3`; the `test:t10` step in `ci.yml` sets `LHCI_RUNS: "5"`
   alongside the existing `LHCI_CI: "1"` (which still controls
   `--no-sandbox`); `tests/run-t10.sh` echoes the effective count at start
   (`T10: Lighthouse sample count — numberOfRuns=N (LHCI_RUNS=...)`) so the
   log proves which sample the run used.

3. **lhci failure detail surfaced.** On `lhci autorun` failure,
   `tests/run-t10.sh` now prints one line per failed assertion
   (`url · category · actual · expected`) parsed from
   `.lighthouseci/assertion-results.json` before exiting nonzero — no more
   blind FAIL lines. If the results file is absent (lhci failed before the
   assert phase) it says so instead.

## Acceptance results

- `npm run test:t11` — PASS (updated guard exit-0/gating + LHCI_RUNS wiring assertions)
- `npm run test:t10` — PASS locally; log echoes `numberOfRuns=3 (LHCI_RUNS=<unset, default 3>)`
- `TZ=UTC npm run test:t4` — PASS
- `npm run build` — PASS (16 pages)

Committed as `R4: CI guard exit-0 skip, LHCI_RUNS wiring, assertion visibility`
with this checkpoint and `R4-REMEDIATION.md`; status clean after.
DO NOT PUSH — the reviewer pushes and re-proves on the live runners.
