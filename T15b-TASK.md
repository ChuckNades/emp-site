# T15b — Apply the ratified identity system (design brief tokens, site-wide)

Work ONLY on `dev`. Never touch `main`. DO NOT PUSH. Existing tests extended-never-weakened.
The design authority is reproduced IN FULL below — implement it exactly; invent no tokens.

## Tokens (CSS custom properties in a single `src/styles/tokens.css`, imported by Base)
--teal: #0F8B8D        (brand anchor: fields, banners, large display text ≥24px/700, mark ground)
--teal-interactive: #0C7779  (buttons, links, normal-size teal text on light — 5.0:1 on --bg)
--teal-tint-80: #3FA2A4  (decorative on light; text only on --ink)
--teal-tint-60: #6FBABB  (decorative on light; text only on --ink)
--coral: #FF6B5C       (accent, decorative on light/teal; semantic only on --ink)
--gold: #FFB13C        (accent/spark, same rule)
--ink: #1F2933         (body text; dark surface where accents may carry meaning)
--bg: #FAF7F2          (page background)
--surface: #FFFFFF     (cards/inputs only, never full-page)
Spacing scale --space-1..9: 4,8,12,16,24,32,48,64,96px. Page max 1200px; prose measure 72ch.
12-col grid desktop/24px gutters → 6-col at 768 → 1-col at 640. Breakpoints 640/768/1024/1280.
Section padding --space-8 desktop, --space-6 mobile.

## Type
Source Sans 3 variable (wght 400-700) everywhere; Literata variable bound ONLY to a
`.article-body` class on cluster/post body text. Self-hosted WOFF2, latin subset, in
src/assets/fonts/ (fetch real files from Google Fonts github or gstatic; commit them);
preload Source Sans 3 only; font-display: swap; size-adjust-tuned system fallbacks.
Scale (rem): 0.8 caption · 1.0 body (lh 1.6) · 1.25 h4 · 1.563 h3 · 1.953 h2 · 2.441 h1 ·
3.052 display (home hero only). Headings lh 1.15-1.25. Article body 1.125rem Literata lh 1.7.
Ship weights 400/600/700 via the variable axis only.

## Application rules
- Header: --teal ground, off-white text, reversed mark (emp-mark-reversed.svg) — this is the
  first teal ground, so the reversed variant NOW enters use. Footer: --ink ground, --bg text.
- Links/buttons on light: --teal-interactive. Focus: 2px --teal-interactive outline, 2px offset,
  always visible.
- ACCENT ROLES (closed list — coral/gold may appear ONLY as): link hover underline accent ·
  eyebrow labels on --ink/--teal surfaces · blockquote/callout left borders · card hover borders ·
  the single hero CTA border-accent. Meaning never by color alone.
- Motion: 150-200ms ease-out hover/focus only; prefers-reduced-motion collapses to none.
- Neutral functional copy unchanged — this task styles, it never writes words.

## Contrast CI check
`tests/check-contrast.mjs` as `test:t15b`: parses tokens.css, computes WCAG ratios, asserts the
declared pairs: ink/bg ≥ 4.5 · teal-interactive/bg ≥ 4.5 · off-white-on-teal ≥ 3 (large only) ·
coral/ink ≥ 4.5 · gold/ink ≥ 4.5 · tints/ink ≥ 4.5; FAILS if any page CSS uses coral/gold as
normal-size text color on --bg or --teal (scan built CSS for those color values in text contexts).

## Post-task reruns (the PRD rule — run ALL, in this order, all must pass)
test:t7, test:t8 (fonts join the ≤100KB walk — woff2 files are exempt from the IMAGE walk but
page-weight sanity: no woff2 > 300KB), test:t9, test:t10 (thresholds unchanged — perf must
survive the fonts), test:t18, plus test:t15b and the full remaining battery.

## Acceptance
1. All the above suites exit 0 locally.
2. Commit `T15b: identity system applied (tokens, type, accents)` with T15b-CHECKPOINT.md and
   this file; status clean. DO NOT PUSH.
