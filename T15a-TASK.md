# T15a — Brand asset integration: mark, favicon, OG (supervised task)

Work ONLY in this repo on the checked-out `dev` branch. Never touch `main`, never push.
Existing tests extended-never-weakened. The five files in src/assets/brand/ are ratified,
locked assets — consume, never modify. The mark is ALREADY vector (SVG) — never rasterize the
mark through the image pipeline; portraits already flow through it (T8).

## Build
1. **Header/footer mark**: render `emp-mark.svg` in the Base layout header (inline or <img>, at
   natural small size, linked to /) and footer. Use `emp-mark-reversed.svg` nowhere yet (no teal
   grounds exist until the design system lands — note this in the checkpoint).
2. **Favicon set** derived from `emp-mark-small.svg`: emit `favicon.svg` (copy of the small mark)
   plus generated PNG sizes 32/180 (apple-touch) via sharp at build or a committed one-time
   generation script (`scripts/gen-favicons.mjs`) whose OUTPUTS are committed to public/.
   Wire the <link rel> tags in the Base head.
3. **OG default image**: `public/og-default.png` generated from `emp-mark.svg` (1200x630, mark
   centered on off-white #FAF7F2 — these are the ratified brand ground + mark, not new design).
   Every page's OG tags gain `og:image` pointing at it (absolute URL via SITE constant).
4. **Superseded-asset + quarantine grep** in a new `tests/run-t15a.sh`, wired as the
   `test:t15a` entry in package.json scripts (add it):
   a. Zero references anywhere in the repo (excluding node_modules, .codex-tmp, dist) to
      `_quarantine/` or `emp-squircle-gold-sun.png` (a superseded raster logo that must never return).
   b. Every built page's `og:image` content is the ABSOLUTE url `https://expertmortgagepro.com/og-default.png`
      and `dist/og-default.png` exists.
   c. Exactly these files exist in dist/: `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`
      (180px), `og-default.png`; the first three ≤ 100 KB, og-default.png ≤ 300 KB. The Base head
      emits `<link rel="icon">` (svg + 32 png) and `<link rel="apple-touch-icon">` matching those paths.
   e. Header contains an anchor to `/` wrapping the mark (match `emp-mark` in its src/inline svg
      title) and the footer contains the mark reference too — asserted on every built page.
   d. The T8 image gate still passes (the favicon/OG PNGs are pipeline-exempt public/ assets —
      if run-t8's dist walk flags them, add a pinned allowlist for exactly these four files).
## Acceptance
1. `npm run test:t15a` exits 0; ALL prior suites still exit 0 (t8 note above).
2. Commit `T15a: brand mark integration (favicon/OG/header)` with T15a-CHECKPOINT.md and this
   file; status clean.
Do not do any work beyond T15a.
