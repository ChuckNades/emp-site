# T7 — Internal-link contract, floor not ceiling (supervised task 7)

Work ONLY in this repo on the checked-out `dev` branch. Never touch `main`, never push.
Do not modify src/assets/brand/ or earlier T*-TASK/CHECKPOINT files. Existing tests may be
extended, never weakened.

## Build

**A link-check script** `tests/check-links.mjs` wired as `npm run test:t7`. The npm script itself
performs the fixture install + a FRESH `npm run build` before checking (same pattern as
run-t2/t4/t5 — never runs against a stale dist/), then walks `dist/` and asserts the FLOOR
(each line = one PASS/FAIL; no item may be skipped as "already satisfied"):

1. Every cluster article page links to its owning hub.
2. Every hub page links to every non-draft cluster whose `category` OR `alsoRelevantTo` names it.
3. Every geo city hub (`/huntsville/`, `/birmingham/`) links to the learn hub and the grow hub
   (resolve slugs through hubs.ts — no hardcoded slug literals in the script; import or read the map).
4. Every state page (`/alabama/`, `/tennessee/`, `/mississippi/`) links to both city hubs.
5. Every non-draft cluster links to ≥2 DISTINCT sibling clusters of its lane — "sibling" = another
   non-draft cluster sharing the owning hub; two links to the same sibling count once — or to ALL
   siblings when fewer than 3 exist. The script COMPUTES the requirement from the collection,
   never hardcodes fixture names.
6. Zero broken internal links anywhere in dist/ (every internal href resolves to a built page or
   an allowlisted not-yet-built route: /market/huntsville/ only, until T17 lands). Fragment hrefs
   (`/page/#id` or `#id`) additionally require the target id to exist in the destination page.

**Floor, not ceiling (binding on the script):** author-placed cross-lane links are permitted
everywhere and never flagged; NOTHING asserts lane purity; the script only checks the minimums
above and broken links.

**Template changes allowed if a floor item fails:** if cluster templates don't yet emit sibling
links (item 5), add a "Related" section to the cluster template that lists 2 siblings of the
owning lane (collection-driven, neutral heading, excluding self; all siblings when <3 exist).
That is the ONLY template change permitted in this task.

## Acceptance
1. `npm run test:t7` exits 0 with per-floor PASS lines.
2. Clean-repo `npm run build` + all prior test scripts (`test:jsonld`, `test:t2`, `test:t4`,
   `test:t5`, `test:t6`) still exit 0.
3. Commit `T7: internal-link contract (floor)` with T7-CHECKPOINT.md AND this task file; status clean.

Do not do any work beyond T7.
