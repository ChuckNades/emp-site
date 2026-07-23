# R5 Checkpoint — lhci chromeFlags for CI runners

One fix from the live GitHub Actions runs. Work done only on `dev`;
`main` untouched; nothing pushed. Exactly the one finding; no other
changes.

## What was fixed

**Chrome crash at launch under lhci on GitHub runners.** CI t10 failed with
"Unable to connect to Chrome" (SIGABRT at launch). `lighthouserc.cjs`
`collect.settings.chromeFlags` now sets `--no-sandbox` and
`--disable-dev-shm-usage` unconditionally — required on runners whose kernel
disallows Chromium's user-namespace sandbox, harmless locally (previously
`--no-sandbox` was gated on `LHCI_CI=1`). `tests/run-t10.sh`'s failure
message updated: when `.lighthouseci/assertion-results.json` is absent, it
now fails with "lhci failed before assert" without the misleading
"below threshold" wording (which is only used when assertion results exist).

## Acceptance results

- `npm run test:t10` — PASS locally (exit 0); log echoes
  `numberOfRuns=3 (LHCI_RUNS=<unset, default 3>)` and all T10 Lighthouse
  gates passed
- `npm run build` — PASS (exit 0)

Committed as `R5: lhci chromeFlags for CI runners` with this checkpoint and
`R5-REMEDIATION.md`; status clean after.
DO NOT PUSH — the reviewer pushes and re-proves on the live runners.
