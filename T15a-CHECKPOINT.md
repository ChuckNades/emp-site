# T15a Checkpoint — brand asset integration: mark, favicon, OG

## What was built
- `scripts/gen-favicons.mjs` — one-time brand asset generation script; its
  OUTPUTS are committed to `public/` (re-run only if the ratified assets
  change). Consumes the locked `src/assets/brand/` SVGs, never modifies them:
  - `public/favicon.svg` — verbatim copy of the ratified small mark
    `emp-mark-small.svg`.
  - `public/favicon-32.png` (32px) + `public/apple-touch-icon.png` (180px) —
    rasterized from `emp-mark-small.svg` via sharp at high density.
  - `public/og-default.png` (1200x630) — the ratified primary mark
    `emp-mark.svg` centered on the ratified off-white brand ground `#FAF7F2`.
    Verified: 1200x630, corner pixel `#FAF7F2`, center pixel mark teal
    `#0F8B8D`. All four outputs well under their size caps.
- `src/layouts/Base.astro` — the only layout change:
  - Head gains `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
    `<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">`,
    and `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`.
  - Every page's OG tags gain `og:image` = absolute
    `https://expertmortgagepro.com/og-default.png` (built via
    `new URL('/og-default.png', SITE)`).
  - Header: an anchor to `/` wrapping the primary mark `<img>` (width/height
    40). Footer: the primary mark `<img>` (width/height 32). The mark is
    imported as `emp-mark.svg?url` and rendered at natural small size — it is
    ALREADY vector and is never run through the raster image pipeline.
- `astro.config.mjs` — `vite.build.assetsInlineLimit` set to a function that
  returns `false` for `.svg` (so the mark emits as a real hashed
  `/_astro/emp-mark.<hash>.svg` file whose src carries `emp-mark`, rather than
  an inlined `data:` URI that the T8 gate bans) and `undefined` (default
  inline behavior) for everything else — the MediaFacade script must stay
  inlined because T9 bans `<script src>` in initial HTML.
- `tests/check-images.mjs` — extended (never weakened): a pinned allowlist
  `T15A_EXEMPT` of exactly the three pipeline-exempt public/ brand PNGs
  (`favicon-32.png`, `apple-touch-icon.png`, `og-default.png`). Clause a
  scrubs references to these three before the banned-extension and
  external-URL scans (the `og:image` absolute URL and the PNG favicon
  `<link>` hrefs would otherwise trip it); clause b skips exactly these three
  files in the 100 KB size-cap walk. All other scans unchanged.
- `tests/run-t15a.sh` wired as `npm run test:t15a` — installs the valid
  fixture set (same `collection_for` mapping as run-t2), runs a FRESH
  `npm run build` (never checks a stale `dist/`), then asserts, one PASS/FAIL
  line each: (a) quarantine grep — zero references repo-wide (excluding
  node_modules/.codex-tmp/dist/.git) to `_quarantine/` or
  `emp-squircle-gold-sun.png`, the only allowed mentions being the task file
  and this test script which name them as match literals; (b) every built
  page's `og:image` is the absolute default URL and `dist/og-default.png`
  exists; (c) exactly the four favicon/OG files exist in dist/, the three
  favicons ≤ 100 KB and og-default.png ≤ 300 KB, and the Base head emits the
  matching `<link rel="icon">` (svg + 32 png) and `<link rel="apple-touch-icon">`
  on every page; (e) header has an anchor to `/` wrapping the mark (`emp-mark`
  in its src) and the footer references the mark too, on every built page;
  (d) the T8 image gate (`check-images.mjs`) still passes over the same fresh
  dist/. Fixture cleanup via trap on exit.
- `package.json` — added `test:t15a`.

## Note: reversed mark unused
`emp-mark-reversed.svg` is intentionally NOT used anywhere yet — no teal
grounds exist until the design system lands (T15b). Only the primary mark
`emp-mark.svg` (header/footer) and the small mark `emp-mark-small.svg`
(favicons) are consumed in this task.

## Acceptance results
1. `npm run test:t15a` exits 0 — fixture build PASS + quarantine grep +
   og:image + favicon/OG files + header/footer mark + T8 image gate all PASS
   — PASS.
2. All prior suites exit 0: `npm run test:jsonld`, `test:t2`, `test:t4`,
   `test:t5`, `test:t6`, `test:t7`, `test:t8`, `test:t9` — PASS, no
   regressions. Clean-repo `npm run build` exits 0 — PASS.
3. Committed as `T15a: brand mark integration (favicon/OG/header)` with this
   checkpoint and the task file included; status clean after — PASS.
