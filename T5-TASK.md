# T5 — Geo hubs + state pages (supervised task 5)

Work ONLY in this repo on the checked-out `dev` branch. Never touch `main`, never push.
Do not modify src/assets/brand/ or earlier T*-TASK/CHECKPOINT files. Existing test scripts may
not be weakened; `tests/validate-jsonld.mjs` MAY be extended (add assertions, never remove any).

## Copy policy (binding)
You write NO marketing/editorial copy and NO local-market claims. Structure, neutral functional
headings, and facts.ts-sourced strings only. Empty facts.ts fields render nothing (never invent
addresses/claims). FORBIDDEN anywhere: service-area assertions ("serving X and surrounding areas",
"proudly serving"), invented market statistics, capture elements (<form>/<input>).

## Build

**1. Five geo routes** using the Base layout:
- `/huntsville/` — city hub. H1 "Huntsville". Sections (headings + empty/neutral structural content):
  an office section rendering `facts.huntsvilleAddress` (empty-safe), and a hub-unique section
  linking to `/market/huntsville/` (link may 404 until a later task — fine). Links to `/learn/` and
  `/grow/` in body (also may 404 until T6 — fine).
- `/birmingham/` — city hub. H1 "Birmingham". An office section rendering `facts.birminghamAddress`,
  and a **first-class Hoover section** (heading "Hoover" with an empty structural content slot —
  Pete authors the Hoover content later; you write NO sentence there. The heading itself is the
  ratified structure: Hoover lives inside /birmingham/). Links to `/learn/` and `/grow/`.
- `/alabama/`, `/tennessee/`, `/mississippi/` — state pages. H1 = state name. Render
  `facts.licensureStatement` (empty-safe placeholder element with a stable id, e.g.
  `<p id="licensure"></p>`) and `facts.nmls`. Link down to BOTH city hubs.

**2. JSON-LD:**
- City hubs: `MortgageBroker` (from the existing src/lib/jsonld.ts emitters — extend if needed)
  with `areaServed` EXACTLY equal to `facts.licensureStates` and address from the respective
  facts field, + `BreadcrumbList`.
- State pages: `BreadcrumbList` only (no invented LocalBusiness per state).

**3. Distinctness (anti-doorway):** the two city hubs must differ in `<title>`, meta description,
H1, and carry ≥2 hub-unique sections each (sections whose heading text appears on that hub and
NOT on the other).

**4. Test script** `tests/run-t5.sh` wired as `npm run test:t5` (nonzero on failure, PASS lines):
a. Build; all 5 routes exist in `dist/`.
b. Zero address/NMLS/licensure string literals in `src/pages/**` and `src/layouts/**` — grep for
   "55223" and street-address patterns in templates must return 0 (facts.ts is the only source).
   ALSO assert per-route wiring in source: `huntsville.astro` references `huntsvilleAddress` and
   not `birminghamAddress`; `birmingham.astro` the reverse (correct field per hub, provable even
   while both values are empty [FILL]s).
c. Every `areaServed` in dist JSON-LD equals exactly ["AL","TN","MS"].
d. City-hub distinctness: title/meta/H1 differ, each hub has ≥2 headings absent from the other,
   AND the two hubs' `<main>` innerHTML are not identical.
e. State pages contain the licensure placeholder element and both city-hub links.
f. Forbidden-copy scan over the five new pages: 0 hits for serving-area phrasing and capture elements.
g. `npm run test:jsonld` extended: add the 5 routes to its walk (it already walks all of dist — ensure
   MortgageBroker required-props pass on city hubs).

## Acceptance
1. `npm run test:t5` exits 0; `npm run build`, `test:jsonld`, `test:t2`, `test:t4` all still exit 0.
2. Commit `T5: geo hubs + state pages` with T5-CHECKPOINT.md; status clean.

Do not do any work beyond T5.
