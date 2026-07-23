# V1 — Stage-3 visual iteration 2 (Sol critique fixes). Work ONLY on dev. DO NOT PUSH.
Style only — no copy beyond the one sanctioned empty-state line below; tokens.css values are
ratified and immutable; all changes use existing tokens/scale.

1. **Market page (HIGH x2):** readable data presentation — body-size table text (1rem), row
   striping with a teal-tint at low alpha or border tokens, --space-6 between series sections,
   section headings at h3 scale, tables wrapped in overflow-x containers for mobile (no page
   horizontal scroll), caption styled as the section lead. Desktop: constrain tables to the
   prose measure; narrative sentence styled as a lead paragraph.
2. **Mobile nav (MED):** at <768px collapse the flat nav into a clean wrap — smaller type
   (caption scale), tighter gaps (--space-2), full-bleed teal ground with adequate touch targets
   (min 44px), mark row separated from link rows. No hamburger/JS — pure CSS wrap, tidy.
3. **Tool island (MED):** field spacing --space-4, labels above inputs, button full-width on
   mobile, --surface card ground with --space-5 padding and a subtle border.
4. **FAQ empty state (LOW):** when no entries exist render exactly: "Answers are being compiled."
   (mirrors the sanctioned /results/ pattern) — remove it from rendering automatically once
   entries exist.

Rerun and pass: test:t15b, test:t7, test:t8, test:t10, test:t18. Commit
`V1: stage-3 visual iteration (market tables, mobile nav, island, faq empty state)` with
V1-CHECKPOINT.md and this file; status clean. DO NOT PUSH.
