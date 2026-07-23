# V1 Checkpoint — stage-3 visual iteration (market tables, mobile nav, island, faq empty state)

Style-only iteration from V1-VISUAL.md (Sol critique fixes). Work done only on
`dev`; `main` untouched; nothing pushed. `tokens.css` values untouched — every
change below applies existing tokens/scale only. No copy changed beyond the one
sanctioned empty-state line.

## What was changed

**1. Market page (`src/pages/market/huntsville.astro`) — readable data
presentation.** Tables now render at body size (`--text-body`) with row
striping (teal at 8% alpha over `--surface` via `color-mix`) and
`--teal-tint-60` row borders. Series sections are separated by `--space-6`
(`section + section`), and the section headings are now `<h3>` elements (h3
scale). Each table sits in a `.table-wrap` with `overflow-x: auto` so mobile
scrolls the table, never the page; on desktop `.table-wrap` is constrained to
the prose measure (`--measure`). The `<caption>` is styled as the section lead
(h4 scale, bold, top, left-aligned), and the narrative sentence carries
`.lead` (h4-scale lead paragraph).

**2. Mobile nav (`src/layouts/Base.astro`).** Below 768px the flat nav
collapses into a clean pure-CSS wrap: the header stacks (mark row separated
from the link rows by a `--teal-tint-80` hairline and `--space-3` rhythm), the
link list keeps `flex-wrap` with `--space-2` gaps at caption scale
(`--text-caption`), and every link gets `min-height: 44px` via inline-flex so
touch targets stay adequate. The teal ground is full-bleed (header already
spans the viewport). No hamburger, no JS.

**3. Tool island (`src/components/ToolIsland.astro`).** The island section is
now a `--surface` card with `--space-5` padding and a subtle
`--teal-tint-60` border. The form is a grid with `--space-4` field spacing;
each `.field` stacks its label above the input (`--space-1` gap). The submit
button goes full-width below 768px. Markup/script contract unchanged — still
a shell with the always-rejecting token gate and zero network calls.

**4. FAQ empty state (`src/pages/faq.astro`).** When the `faqs` collection has
no entries the page renders exactly "Answers are being compiled." (mirrors the
sanctioned `/results/` pattern). It is gated on `faqs.length === 0`, so it
disappears automatically the moment an entry exists.

## Acceptance results

- `npm run test:t15b` — PASS (all declared contrast pairs; no coral/gold
  accent text on light surfaces in built CSS)
- `npm run test:t7` — PASS (all link-contract floors over a fresh fixture
  build)
- `npm run test:t8` — PASS (all four image-gate clauses)
- `npm run test:t10` — PASS (all Lighthouse gates, median-of-3 mobile)
- `npm run test:t18` — PASS (route allowlist, capture elements only inside
  `[data-tool-island]`, areaServed == licensure states, zero
  subscribe/newsletter surfaces)

Committed as `V1: stage-3 visual iteration (market tables, mobile nav, island,
faq empty state)` with this checkpoint and `V1-VISUAL.md`; status clean after.
DO NOT PUSH.
