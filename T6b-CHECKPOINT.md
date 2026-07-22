# T6b Checkpoint — home lane-routing + global nav completion

## What was built
- `src/layouts/Base.astro` — global nav replaced with a FLAT link list in the
  ratified order: Home, Learn, Grow, Become, FAQ, Huntsville, Birmingham,
  About, Results, Contact. The three hub entries map over `HUB_CATEGORIES`
  with labels from `HUB_LABELS` and paths from `HUB_SLUGS` — zero slug
  literals. State pages stay reachable via the geo pages, not the top nav.
- `src/pages/index.astro` — keeps `<h1>EMP</h1>` and adds ONE lane-routing
  `<section>`: three links, each = hub label + the ratified descriptor line
  (Learn → "For homebuyers", Grow → "For referral partners", Become → "For
  originators"), paths resolved through `HUB_SLUGS`. Home's `<main>` contains
  exactly the h1 and this one section — nothing else. JSON-LD unchanged.
- `tests/check-links.mjs` — extended (add-only, scoped selectors, no
  whole-page grep), floors 1–6 untouched:
  7. home's lane section (the single `<section>` inside `<main>`) contains
     links to all three hubs, slugs compiled out of `hubs.ts` as before;
  8. the `<nav>` element on EVERY page in dist/ links to all three hubs and
     `/faq/`;
  9. home's `<main>` contains exactly one `<h1>` and one `<section>` and no
     other element types besides those and their children (h1/section removed
     from the main fragment, then any remaining tag fails; the section
     fragment may contain only ul/li/a markup and text).
- No editorial copy — neutral labels plus the three ratified lane descriptor
  lines only.

## Acceptance results
1. `npm run test:t7` exits 0 with the new floor lines: fixture build PASS,
   floors 1–9 all PASS (7: home lane section links to all three hubs; 8:
   every page `<nav>` links to all three hubs and /faq/; 9: home `<main>` is
   exactly one `<h1>` plus one `<section>`) — PASS.
   All other suites exit 0: `test:t2`, `test:t4`, `test:t5`, `test:t6`,
   `test:t8`, `test:t9`, `test:jsonld`; clean-repo `npm run build` exits 0
   (15 pages) — PASS, no regressions.
2. T6 slug-literal scan rerun: 0 `"/learn/"`/`"/grow/"`/`"/become/"` literals
   in `src/**` outside `src/config/hubs.ts` — PASS.
3. Committed as `T6b: home lane-routing + nav completion` with this
   checkpoint and T6b-TASK.md included; status clean after — PASS.
