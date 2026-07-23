# T18 Checkpoint — surface guardrails on the final dist (last build task)

Work done only on `dev`; `main` untouched; nothing pushed. Existing tests
extended, never weakened. No work beyond T18.

## What was built

**`tests/check-t18.mjs`** — four surface guardrails over a clean production
`dist/`, reading `src/config/hubs.ts` and `src/data/facts.ts` (compiled from
TS via the check-t17 mechanism, so no value is re-hardcoded):

1. **Exact route allowlist.** The set of built routes (every
   `dist/**/index.html` plus root files) must equal EXACTLY: `/`, `/about/`,
   `/results/`, `/contact/`, `/faq/`, the three hub roots from `hubs.ts`
   (`/learn/`, `/grow/`, `/become/`), `/huntsville/`, `/birmingham/`,
   `/alabama/`, `/tennessee/`, `/mississippi/`, `/market/huntsville/`,
   `/podcast/`, `/videos/`, `/404` if Astro emits one — plus the exact root
   artifact set (robots.txt, llms.txt, sitemap-index.xml, sitemap-0.xml,
   favicon.svg, favicon-32.png, apple-touch-icon.png, og-default.png, the one
   IndexNow key `.txt` matching the committed `public/` key file). `_astro/**`
   is the only wildcard bucket, limited to extensions
   `{css,js,webp,avif,svg,woff2}`. Collection-derived child pages are allowed
   only under their parents (learn/grow/become/podcast/videos slugs from
   non-draft entries — none in a clean build). Any surplus route or file
   class fails, listed by path; any missing ratified route fails too.
2. **Capture elements.** Zero `<form>`/`<input>`/`<textarea>`/`<select>` in
   dist HTML except inside the single `[data-tool-island]` element per page,
   and that element may appear only on `/` and `/huntsville/`.
3. **areaServed.** Every `areaServed` value in any JSON-LD block (recursively
   visited) must equal exactly the `facts.ts` licensure states (`AL, TN, MS`);
   zero values outside it.
4. **No subscribe/newsletter surfaces.** Case-insensitive scan of dist HTML
   for `subscribe|newsletter|sign[ -]?up|mailing list` = 0 hits.

**`tests/run-t18.sh`** (wired as `npm run test:t18`) — runs LAST: removes any
leftover fixture collection content, performs a fresh CLEAN production build
(no fixtures, never a stale `dist/`), then runs `check-t18.mjs`. Exits
nonzero on any failure, with per-guardrail PASS lines.

**CI wiring.** `test:t18` added to `.github/workflows/ci.yml` as the final
battery step, immediately after `test:t10`. `tests/run-t11.sh`'s
battery-completeness assertion extended (check 1b): test:t11 now FAILS if
`npm run test:t18` is absent from the ci.yml gate steps — independent of the
package.json-derived check, so the battery can never silently lose the
surface guardrails.

## Acceptance results

- `npm run test:t18` — PASS (exit 0): clean production build PASS, then all
  four per-guardrail PASS lines (route allowlist: 16 routes + 9 root
  artifacts exactly; capture elements; areaServed: 4 occurrences, zero
  outside; subscribe/newsletter: 0 hits)
- `npm run test:t11` — PASS (exit 0), including the new
  "test:t18 (surface guardrails) present as a ci.yml gate step" line; all 14
  test:* scripts are ci.yml gate steps
- Full suite list: test:t2, t4, t5, t6, t7, t8, t9, t10, t11, t12, t13,
  t15a, t17, t18, test:jsonld
- `npm run build` (clean) — PASS (exit 0)

Committed as `T18: surface guardrails (route allowlist, capture, areaServed)`
with `T18-TASK.md`; status clean after. DO NOT PUSH.
