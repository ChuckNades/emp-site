# R5 — one fix. Work ONLY on dev. DO NOT PUSH.

CI t10 root cause (now visible): Chrome crashes at launch under lhci on GitHub runners —
"Unable to connect to Chrome", SIGABRT. Fix: in lighthouserc.cjs `collect.settings`, set
`chromeFlags: "--no-sandbox --disable-dev-shm-usage"` (unconditional — harmless locally, required
on runners). Also update run-t10.sh's failure message: when assertion-results.json is absent, say
"lhci failed before assert" WITHOUT the misleading "below threshold" wording.

Acceptance: local `npm run test:t10` exits 0 (echoes run count + flags); build exits 0. Commit
`R5: lhci chromeFlags for CI runners` with R5-CHECKPOINT.md and this file; status clean. DO NOT PUSH.
