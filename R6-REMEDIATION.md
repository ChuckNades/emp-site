# R6 — one fix, bulletproof this time. Work ONLY on dev. DO NOT PUSH.

CI evidence: lighthouserc.cjs carries chromeFlags [--no-sandbox, --disable-dev-shm-usage], yet
the runner's ChromeLauncher still hits "No usable sandbox" FATAL — LHCI's flag plumbing is not
delivering them. Stop relying on it: in tests/run-t10.sh, generate a wrapper script
`.codex-tmp/chrome-wrapped.sh`:

    #!/usr/bin/env bash
    exec "$REAL_CHROME" --no-sandbox --disable-dev-shm-usage "$@"

(with $REAL_CHROME expanded to the resolved Playwright chromium path at generation time),
chmod +x, and export CHROME_PATH pointing at the WRAPPER. Keep the lighthouserc chromeFlags too
(belt and suspenders). run-t10.sh echoes the wrapper path + a `head -2` of it as proof in logs.

Acceptance: local `npm run test:t10` exits 0 and the echo shows the wrapper in use; build exits 0.
Commit `R6: chrome wrapper guarantees sandbox flags for lhci` with R6-CHECKPOINT.md and this
file; status clean. DO NOT PUSH.
