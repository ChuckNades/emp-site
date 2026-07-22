# T5 Checkpoint — geo hubs + state pages

## What was built
- `src/pages/huntsville.astro` — city hub, H1 "Huntsville". Sections: Office
  (renders `facts.huntsvilleAddress`, empty-safe — currently an empty [FILL]
  string), Huntsville Market (hub-unique section linking to
  `/market/huntsville/`, which 404s until a later task — expected), Resources
  (links to `/learn/` and `/grow/` via `HUB_SLUGS`, 404 until T6 — expected).
- `src/pages/birmingham.astro` — city hub, H1 "Birmingham". Sections: Office
  (renders `facts.birminghamAddress`, empty-safe), Hoover (first-class
  hub-unique section: the heading is the ratified structure; the content slot
  is deliberately empty — Pete authors Hoover content later), Resources (links
  to `/learn/` and `/grow/`).
- `src/pages/alabama.astro`, `src/pages/tennessee.astro`,
  `src/pages/mississippi.astro` — state pages, H1 = state name. Each renders
  `facts.licensureStatement` in the stable placeholder element
  `<p id="licensure">` (empty-safe) and `facts.nmls` in `<p id="nmls">`, and
  links down to both city hubs (`/huntsville/`, `/birmingham/`).
- `src/lib/jsonld.ts` — added `hubMortgageBrokerJsonLd(address)`: per-hub
  `MortgageBroker` emitter whose address comes from the hub's own facts field
  and whose `areaServed` is always exactly `[...licensureStates]`
  (`["AL","TN","MS"]`). The existing `mortgageBrokerJsonLd()` is unchanged.
  - City hubs emit `MortgageBroker` + `BreadcrumbList`.
  - State pages emit `BreadcrumbList` only (no invented per-state
    LocalBusiness).
- `src/config/page-dates.ts` — the five geo routes added with today's date so
  their sitemap entries carry `<lastmod>`.
- `tests/run-t5.sh` wired as `npm run test:t5` (nonzero exit on any failure):
  a. builds; asserts all 5 routes exist in `dist/`;
  b. asserts zero `55223` and zero street-address-pattern literals in
     `src/pages/**` and `src/layouts/**` (facts.ts is the only source), plus
     per-route wiring: `huntsville.astro` references `huntsvilleAddress` and
     not `birminghamAddress`, `birmingham.astro` the reverse;
  c. asserts every `areaServed` in dist JSON-LD equals exactly
     `["AL","TN","MS"]` (4 occurrences checked);
  d. asserts city-hub distinctness: `<title>`, meta description, and H1 all
     differ; each hub carries ≥2 headings absent from the other (Huntsville:
     "Huntsville", "Huntsville Market"; Birmingham: "Birmingham", "Hoover");
     and the two hubs' `<main>` innerHTML are not identical;
  e. asserts each state page contains `id="licensure"` and links to both city
     hubs;
  f. forbidden-copy scan over the five pages: 0 hits for serving-area phrasing
     (`serving X`, `proudly serving`, `surrounding areas`) and capture
     elements (`<form`, `<input`);
  g. runs `npm run test:jsonld` (already walks all of dist — the 5 new routes
     are covered; MortgageBroker required props pass on the city hubs).
- No marketing/editorial copy written; no local-market claims; empty facts
  fields render as empty strings; no capture elements anywhere.

## Acceptance results
1. `npm run test:t5` exits 0, all 9 PASS lines printed — PASS.
2. `npm run build` exits 0; `npm run test:jsonld` exits 0 (9 pages, all PASS);
   `npm run test:t2` exits 0; `npm run test:t4` exits 0 — PASS, no regressions.
3. Committed as `T5: geo hubs + state pages` with this checkpoint included;
   status clean after — PASS.
