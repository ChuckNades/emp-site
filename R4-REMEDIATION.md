# R4 — CI round 3 fixes. Work ONLY on dev. DO NOT PUSH. Exactly these three; nothing else.

1. **content.yml guard exit semantics.** The guard now correctly detects "not content-only" but
   then exits 1, failing the workflow. A skip is SUCCESS: print the notice and `exit 0`, with all
   subsequent steps gated on a step output (`content_only=true/false`), so a skipped bypass run
   completes green having executed nothing. Mirror-check ci.yml's inverse guard has the same
   success-on-skip semantics. Update run-t11.sh assertions accordingly.
2. **Wire the CI sample count for real.** The CI run still reported "median-of-3": make
   lighthouserc.cjs read `LHCI_RUNS` (default 3) for numberOfRuns, set `LHCI_RUNS: 5` in the
   ci.yml t10 step env, and have run-t10.sh ECHO the effective run count at start (proof in log).
3. **Surface lhci failure detail.** On lhci failure, run-t10.sh must print the assertion results
   (cat `.lighthouseci/assertion-results.json` formatted one line per failed assertion:
   url · category · actual · expected) before exiting nonzero — no more blind FAIL lines.

Acceptance: test:t11, test:t10 (local, echoes run count 3), TZ=UTC test:t4, build all exit 0.
Commit `R4: CI guard exit-0 skip, LHCI_RUNS wiring, assertion visibility` with R4-CHECKPOINT.md
and this file; status clean. DO NOT PUSH.
