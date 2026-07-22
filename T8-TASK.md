# T8 — Image pipeline: WebP/AVIF gate (supervised task 8)

Work ONLY in this repo on the checked-out `dev` branch. Never touch `main`, never push.
Do not modify earlier T*-TASK/CHECKPOINT files. Existing tests may be extended, never weakened.
src/assets/brand/ files may be READ and processed through the pipeline — never modified/deleted.

## Build

**1. Image pipeline** using Astro's built-in `astro:assets` (sharp):
- A reusable `src/components/Pic.astro` wrapping `<Picture />`. API pinned: props
  `{ src (ImageMetadata), alt (string, required), widths?: number[], sizes?: string }`;
  emits AVIF + WebP sources with width/height attributes (no CLS), `loading="lazy"` and
  `decoding="async"` by default.
- Demonstrate it in the About page's (still-empty-bio) structure with the graded portrait from
  `src/assets/brand/emp-portrait-graded-1000.png` rendered through the pipeline — the ONLY page
  change; no copy added. Alt text: render from the `people` pete entry's `name` field, empty-safe
  fallback `"Portrait"` (accessibility text, not copy — never invent a biography line).
  (This proves the brand-portrait ingestion path T15a depends on.)

**2. Format+size gate** `tests/check-images.mjs` wired as `npm run test:t8`
(fresh fixture-install + build first, same pattern as run-t7; PASS lines, nonzero on failure):
a. Built HTML **and CSS** reference content images only from the allowlist {webp, avif, svg} —
   zero .jpg/.jpeg/.png references in any dist/ HTML or CSS file, including `url(...)` values
   (closes the CSS-background bypass). data: URIs and external http(s) image URLs: also zero for now.
b. No image FILE anywhere in dist/ exceeds 100 KB — walk every file with an image extension
   (png/jpg/jpeg/webp/avif/gif/svg) and assert size ≤ 102400 bytes. Both clauses must hold:
   the allowlist closes the sub-100KB-raw loophole, the size cap closes the giant-webp loophole.
c. Every <img>/<source> in dist/ HTML carries width and height attributes (CLS guard).
d. The About page emits at least one AVIF and one WebP source for the portrait, AND
   `src/pages/about.astro` imports `emp-portrait-graded-1000.png` specifically (source-level
   assertion — any random AVIF/WebP on the page cannot satisfy this).

## Acceptance
1. `npm run test:t8` exits 0; clean-repo `npm run build` + all prior suites (`test:jsonld`,
   `test:t2`, `test:t4`, `test:t5`, `test:t6`, `test:t7`) still exit 0.
2. Commit `T8: image pipeline + WebP/AVIF gate` with T8-CHECKPOINT.md AND this task file; status clean.

Do not do any work beyond T8. Note: the raw 1000px PNG masters stay in src/assets/brand/ (they are
build inputs, not dist outputs — the gate governs dist/ only).
