# R6 Checkpoint — chrome wrapper guarantees sandbox flags for lhci

One fix from the live GitHub Actions runs. Work done only on `dev`;
`main` untouched; nothing pushed. Exactly the one finding; no other
changes.

## What was fixed

**LHCI's chromeFlags plumbing was not delivering `--no-sandbox` to the
runner's ChromeLauncher** — CI t10 still died with "No usable sandbox"
FATAL even though `lighthouserc.cjs` carried
`[--no-sandbox, --disable-dev-shm-usage]`. Stopped relying on that
plumbing: `tests/run-t10.sh` now generates a wrapper script
`.codex-tmp/chrome-wrapped.sh`:

    #!/usr/bin/env bash
    exec "$REAL_CHROME" --no-sandbox --disable-dev-shm-usage "$@"

with `$REAL_CHROME` expanded to the resolved Playwright Chromium path at
generation time, `chmod +x`s it, and exports `CHROME_PATH` pointing at the
WRAPPER instead of the raw binary — so the sandbox flags are guaranteed no
matter how lhci launches Chrome. The `lighthouserc.cjs` chromeFlags stay in
place too (belt and suspenders). The script echoes the wrapper path and a
`head -2` of the generated file as proof in the logs.

## Acceptance results

- `npm run test:t10` — PASS locally (exit 0); log echoes
  `T10: CHROME_PATH=/home/peterb/emp-site/.codex-tmp/chrome-wrapped.sh (chrome wrapper)`
  followed by the wrapper's first two lines, and all T10 Lighthouse gates
  passed
- `npm run build` — PASS (exit 0)

Committed as `R6: chrome wrapper guarantees sandbox flags for lhci` with
this checkpoint and `R6-REMEDIATION.md`; status clean after.
DO NOT PUSH — the reviewer pushes and re-proves on the live runners.
