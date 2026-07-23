# T15b Checkpoint — identity system applied (tokens, type, accents)

Work done only on `dev`; `main` untouched; nothing pushed. The design
authority is `T15b-TASK.md` (reproduced in full in the repo) — every token,
type size, accent role, and application rule below implements it exactly; no
tokens were invented.

## What was built

- `src/assets/fonts/` — self-hosted variable WOFF2, latin subset, committed:
  - `source-sans-3-latin-var.woff2` (28,740 B) — Source Sans 3, `wght` axis
    400–700. Verified a true variable font (`fvar`/`gvar` tables present).
  - `literata-latin-var.woff2` (38,996 B) — Literata, `wght` axis 400–700.
  Both fetched from Google Fonts (gstatic), both well under the 300 KB sanity
  cap. Weights 400/600/700 are shipped via the variable `wght` axis only.
- `src/styles/tokens.css` — the single source of truth. Declares the two
  `@font-face` rules (`font-display: swap`, latin subset) and every ratified
  custom property: the nine brand colors with their roles, the `--space-1..9`
  scale (4–96px), page max 1200px, prose measure 72ch, 24px gutters, the four
  breakpoints (640/768/1024/1280), the full rem type scale (0.8 caption →
  3.052 display), and the motion duration/easing. Imported by `Base.astro`.
- `src/layouts/Base.astro` — imports `tokens.css`; preloads Source Sans 3 only
  (`<link rel="preload" as="font" crossorigin>`; Literata loads on demand via
  `font-display: swap`). Header is now the first `--teal` ground with off-white
  (`--bg`) text and the REVERSED mark (`emp-mark-reversed.svg`) — the reversed
  variant enters use here. Footer is `--ink` ground with `--bg` text and the
  primary mark. A global `<style is:global>` block APPLIES the tokens (no raw
  values of its own): the type scale, `--teal-interactive` links/buttons, the
  always-visible 2px `--teal-interactive` focus outline (2px offset), the
  12→6→1-col responsive grid, `--surface` scoped to cards/inputs only, the
  closed list of coral/gold accent roles (link hover underline, eyebrow labels
  on ink/teal surfaces, blockquote left borders, card hover borders), and
  `prefers-reduced-motion` collapsing all transitions to none. size-adjust-tuned
  system fallbacks (`Source Sans 3 Fallback` → Arial, `Literata Fallback` →
  Georgia) keep the swap metric jump minimal.
- `src/pages/[hub]/[slug].astro` — cluster/post body text wrapped in
  `.article-body`, the ONLY place Literata is bound (1.125rem, lh 1.7).
- `src/pages/index.astro` — the home hero `<h1>` bound to the 3.052rem display
  size (home hero only) in `--teal` (brand anchor, ≥24px/700). No copy changed
  anywhere — this task styles, it never writes words.
- `tests/check-contrast.mjs` + `tests/run-t15b.sh` (wired as `npm run
  test:t15b`) — parses `tokens.css` (never re-hardcodes a value), computes
  WCAG ratios, and asserts the declared pairs: ink/bg 13.81 ≥ 4.5 ·
  teal-interactive/bg 5.00 ≥ 4.5 · off-white-on-teal 3.85 ≥ 3 (large only) ·
  coral/ink 5.28 ≥ 4.5 · gold/ink 8.15 ≥ 4.5 · tint-80/ink 4.86 ≥ 4.5 ·
  tint-60/ink 6.62 ≥ 4.5. Then scans the built page CSS and FAILS on any
  coral/gold `color:` (text) declaration on a light `--bg` surface — the
  accent-text ban. Follows the established fixture-build → fresh-dist → check
  pattern.

## Acceptance results (all exit 0 locally, run in the PRD order)

- `test:t7` — PASS (link contract, 9 floors)
- `test:t8` — PASS (image gate; woff2 exempt from the image walk; both woff2
  ≤ 300 KB — 28,740 B and 38,996 B)
- `test:t9` — PASS (5 facade Playwright checks)
- `test:t10` — PASS (Lighthouse gates, thresholds unchanged; perf survived the
  fonts — median-of-3 on the mobile preset, all four categories green)
- `test:t18` — PASS (surface guardrails on a clean production build)
- `test:t15b` — PASS (7 contrast pairs + the coral/gold accent-text ban)
- Full remaining battery — PASS: `test:t2`, `test:t4`, `test:t5`, `test:t6`,
  `test:t11`, `test:t12`, `test:t13`, `test:t15a` (incl. the header/footer
  mark assertion with the reversed mark), `test:t17`, `test:jsonld`.

Committed as `T15b: identity system applied (tokens, type, accents)` with this
checkpoint and `T15b-TASK.md`; status clean after. DO NOT PUSH.
