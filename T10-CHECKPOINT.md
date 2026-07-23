# T10 Checkpoint — Lighthouse gates

## What was built
- `package.json` — `@lhci/cli` exact-pinned at `0.15.1` in devDependencies;
  added `test:t10` script (`bash tests/run-t10.sh`).
- `lighthouserc.cjs` — committed LHCI config. `collect`: the four gated URLs
  under `LHCI_BASE_URL` (set by the runner), `numberOfRuns: 3` (median-of-3),
  no `preset` key — Lighthouse's default settings are already the LHCI default
  mobile emulation preset (mobile form factor + simulated throttling). NOTE:
  an earlier draft set `preset: 'perf'`, which restricts collection to the
  performance category only (SEO/a11y/BP audits never ran, `auditRan: 0`
  assertion failures); removed — the mobile preset must not narrow categories.
  `settings.chromeFlags` pins `--user-data-dir` to a Linux path under
  `.codex-tmp/` (from `LHCI_CHROME_USER_DATA_DIR`, exported by the runner):
  chrome-launcher's WSL detection otherwise assumes a Windows Chrome and hands
  the Linux browser a Windows temp path (`C:\Users\...\lighthouse.NNN`) that
  gets created literally inside the repo. `assert`: category scores only,
  `aggregationMethod: 'median'` — performance ≥ 0.90, seo = 1.00,
  accessibility ≥ 0.95, best-practices ≥ 0.95. `upload`:
  temporary-public-storage (report links only; no server).
- `tests/run-t10.sh` — installs the valid fixture set (same `collection_for`
  mapping as run-t2), fresh `npm run build`, serves `dist/` via
  `astro preview` on port 44310, waits for readiness, runs `lhci autorun`
  (collect + assert against the local URLs), then cleans up fixtures and the
  server via trap. Chromium: reuses the Playwright browser at
  `~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome` via `CHROME_PATH`
  plus the `.codex-tmp/pw-libs` `LD_LIBRARY_PATH` mechanism from run-t9
  (system libnspr4/libnss3/libasound are missing, no sudo).
- `.gitignore` — added `.lighthouseci/` (LHCI run artifacts).

## URL set (fixture build, astro preview)
`/` · `/huntsville/` · `/learn/post-fixture/` (article URL of
`tests/fixtures/valid/post-fixture.mdx`, slug `post-fixture` under the learn
hub) · `/faq/`

## Per-URL median scores (median of 3 runs, mobile emulation)
| URL | Performance | SEO | Accessibility | Best Practices |
|---|---|---|---|---|
| `/` | 1.00 | 1.00 | 0.96 | 1.00 |
| `/huntsville/` | 1.00 | 1.00 | 0.95 | 1.00 |
| `/learn/post-fixture/` | 1.00 | 1.00 | 0.95 | 1.00 |
| `/faq/` | 1.00 | 1.00 | 0.95 | 1.00 |

All four URLs meet all four thresholds (perf ≥ 0.90, seo = 1.00, a11y ≥ 0.95,
bp ≥ 0.95). No underlying page/template fixes were required — the pages passed
as built; the only corrections during bring-up were to the T10 wiring itself
(CHROME_PATH directory name `chrome-linux64`; dropping the `perf` preset so
all four categories are collected; pinning a Linux `--user-data-dir` so
chrome-launcher's WSL path handling stops littering the repo with
`C:\Users\...` profile dirs). Thresholds were not lowered, no audits exempted,
URL set not narrowed.

## Acceptance results
1. `npm run test:t10` exits 0 — all four URLs meet all four thresholds on
   median-of-3 — PASS.
2. Exact suite list + clean build exit 0: `test:jsonld`, `test:t2`, `test:t4`,
   `test:t5`, `test:t6`, `test:t7`, `test:t8`, `test:t9`, `test:t13`,
   `test:t15a`, `test:t17` — all PASS, no regressions; clean-repo
   `npm run build` exits 0 — PASS.
3. Committed as `T10: Lighthouse gates (median-of-3, pinned thresholds)` with
   this checkpoint and the task file included; status clean after — PASS.
