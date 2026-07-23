# T10 — Lighthouse gates (supervised task)

Work ONLY on `dev`. Never touch `main`, never push. Existing tests extended-never-weakened.

## Build
Wire Lighthouse CI: `@lhci/cli` exact-pinned in devDependencies, config `lighthouserc.cjs`
committed. Protocol (pinned, per ratified spec):
- Mobile emulation preset (LHCI default mobile), **median of 3 runs per URL**.
- URL set (the dev/test build WITH the valid fixture set installed, served via astro preview):
  `/` · `/huntsville/` · the article URL of `tests/fixtures/valid/post-fixture.mdx` (its slug
  under the learn hub) · `/faq/`.
- Thresholds (assert block): Performance ≥ 0.90 · SEO = 1.00 · Accessibility ≥ 0.95 ·
  Best Practices ≥ 0.95. Category scores only — no audit-level cherry-picking.
- Runner `tests/run-t10.sh` wired as the `test:t10` package.json script: install fixtures →
  build → preview on a port → `lhci autorun` (collect+assert against the local URLs) → cleanup.
  Chromium: reuse the Playwright browser + the .codex-tmp/pw-libs LD_LIBRARY_PATH mechanism from
  run-t9 if system libs are missing (CHROME_PATH env for lhci).
- If any threshold fails: FIX the underlying page/template issue (this is in scope — perf/a11y/
  SEO/BP defects are build defects), then rerun. Record each fix in the checkpoint. Do NOT lower
  thresholds, exempt audits, or narrow the URL set to pass.

## Acceptance
1. `npm run test:t10` exits 0 — all four URLs meet all four thresholds on median-of-3.
2. This exact suite list + clean build still exit 0: test:jsonld, test:t2, test:t4, test:t5,
   test:t6, test:t7, test:t8, test:t9, test:t13, test:t15a, test:t17.
3. Commit `T10: Lighthouse gates (median-of-3, pinned thresholds)` with T10-CHECKPOINT.md
   (including the per-URL median scores) and this file; status clean.
Do not do any work beyond T10.
