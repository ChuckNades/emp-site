# T7 Checkpoint — internal-link contract (floor not ceiling)

## What was built
- `tests/check-links.mjs` — walks `dist/` and asserts the six floor items,
  one PASS/FAIL line each, nothing skipped:
  1. every cluster article links to its owning hub;
  2. every hub links to every non-draft cluster whose `category` OR
     `alsoRelevantTo` names it (cross-listed posts checked at their canonical
     owning-hub URL);
  3. every geo city hub (`/huntsville/`, `/birmingham/`) links to the learn
     hub and the grow hub — hub slugs are compiled out of `src/config/hubs.ts`
     (via the already-installed `typescript` compiler API) and imported, so
     the script contains zero hub-slug literals;
  4. every state page (`/alabama/`, `/tennessee/`, `/mississippi/`) links to
     both city hubs;
  5. every non-draft cluster links to ≥2 DISTINCT lane siblings (same owning
     hub, self excluded, duplicate links counted once), or to ALL siblings
     when fewer than 3 exist — the requirement is computed by parsing the
     installed posts' frontmatter, never hardcoded;
  6. zero broken internal links anywhere in `dist/` — every internal href
     resolves to a built page or the single allowlisted not-yet-built route
     `/market/huntsville/` (until T17); fragment hrefs additionally require
     the target `id` to exist in the destination page.
  Floor, not ceiling: cross-lane links are never flagged and no lane-purity
  assertion exists anywhere in the script.
- `tests/run-t7.sh` wired as `npm run test:t7` — installs the valid fixture
  set (same `collection_for` mapping as run-t2), runs a FRESH `npm run build`
  (never checks a stale `dist/`), then runs `check-links.mjs`; fixture
  cleanup via trap on exit.
- `src/pages/[hub]/[slug].astro` — the only template changes, both required
  by floor items that failed on the first run:
  - a "Related" nav section (neutral `<h2>Related</h2>`) listing sibling
    clusters of the owning lane — collection-driven (`category` match,
    non-draft, self excluded), every sibling listed, rendered only when at
    least one sibling exists (floor item 5);
  - a breadcrumb nav linking to the owning hub by its `HUB_LABELS` label,
    resolving the slug through `HUB_SLUGS` (floor item 1 — the article
    previously linked to its hub only in JSON-LD, not in visible anchors).
- `package.json` — added `test:t7`.

## Acceptance results
1. `npm run test:t7` exits 0 with per-floor PASS lines (fixture build + 6
   floor PASS lines + script PASS) — PASS.
2. Clean-repo `npm run build` exits 0 (13 pages); `npm run test:jsonld`,
   `npm run test:t2`, `npm run test:t4`, `npm run test:t5`, `npm run test:t6`
   all exit 0 — PASS, no regressions.
3. Committed as `T7: internal-link contract (floor)` with this checkpoint
   and the task file included; status clean after — PASS.
