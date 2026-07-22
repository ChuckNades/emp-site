# T8 Checkpoint — image pipeline + WebP/AVIF gate

## What was built
- `src/components/Pic.astro` — reusable content-image component wrapping
  astro:assets `<Picture />` (sharp). API pinned: `{ src (ImageMetadata),
  alt (string, required), widths?, sizes? }`; emits AVIF + WebP `<source>`
  variants with `fallbackFormat="webp"` (WebP is universally supported and
  keeps the `<img>` fallback inside the {webp,avif,svg} allowlist and under
  the 100 KB cap — the default PNG fallback failed both), explicit
  width/height (no CLS), `loading="lazy"` and `decoding="async"` by default.
- `src/pages/about.astro` — the ONLY page change: renders the graded brand
  portrait `src/assets/brand/emp-portrait-graded-1000.png` through `Pic`
  inside the still-empty-bio `<section aria-label="Bio">`; no copy added.
  Alt text comes from the `people` collection pete entry's `name` field with
  the empty-safe fallback `"Portrait"` (accessibility text, not copy).
- `tests/check-images.mjs` — walks `dist/` and asserts the four gate
  clauses, one PASS/FAIL line each, nothing skipped:
  a. dist/ HTML and CSS reference content images only from {webp, avif,
     svg} — zero .jpg/.jpeg/.png references anywhere in the file (the
     extension scan is context-agnostic, so `url(...)` CSS backgrounds are
     covered), zero data: image URIs, zero external http(s) image URLs;
  b. no image FILE anywhere in dist/ exceeds 100 KB (102400 bytes) — every
     png/jpg/jpeg/webp/avif/gif/svg file walked and size-asserted;
  c. every `<img>` in dist/ HTML carries width and height attributes (the
     CLS guard lives on the replaced element; `<source>` in a `<picture>`
     only selects a resource and takes no width/height attributes per
     HTML spec);
  d. /about/ emits at least one AVIF and one WebP `<source>` for the
     portrait, AND `src/pages/about.astro` imports
     `emp-portrait-graded-1000.png` specifically (source-level assertion).
- `tests/run-t8.sh` wired as `npm run test:t8` — installs the valid fixture
  set (same `collection_for` mapping as run-t2), runs a FRESH `npm run
  build` (never checks a stale `dist/`), then runs `check-images.mjs`;
  fixture cleanup via trap on exit.
- `package.json` — added `test:t8`.

## Acceptance results
1. `npm run test:t8` exits 0 with per-clause PASS lines (fixture build + 4
   clause PASS lines + script PASS) — PASS.
2. Clean-repo `npm run build` exits 0 (13 pages); `npm run test:jsonld`,
   `npm run test:t2`, `npm run test:t4`, `npm run test:t5`,
   `npm run test:t6`, `npm run test:t7` all exit 0 — PASS, no regressions.
3. Committed as `T8: image pipeline + WebP/AVIF gate` with this checkpoint
   and the task file included; status clean after — PASS.
