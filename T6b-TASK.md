# T6b — Home lane-routing + global nav completion (structural gap fix)

Work ONLY in this repo on the checked-out `dev` branch. Never touch `main`, never push.
Existing tests may be extended, never weakened. NO editorial copy — neutral labels only.

## Why this task exists
The ratified sitemap requires Home to "route to all three lanes." Home is still the T1
placeholder and the global nav lists only the four core routes. This task closes that gap —
structure only.

## Build
1. **Global nav** (Base layout): FLAT links (no grouping), in this order: Home, Learn, Grow,
   Become, FAQ, Huntsville, Birmingham, About, Results, Contact. Hub labels/paths from hubs.ts —
   zero slug literals. (State pages stay reachable via geo pages, not top nav.)
2. **Home page**: keep `<h1>EMP</h1>`. Add ONE lane-routing section: three links, each = hub
   label + EXACTLY these descriptor lines (verbatim, they are ratified lane definitions):
   Learn → "For homebuyers" · Grow → "For referral partners" · Become → "For originators".
   Paths resolve through hubs.ts. Home's `<main>` contains EXACTLY the h1 and this one section —
   nothing else (asserted below).
3. **Extend `tests/check-links.mjs` floor** (add, scoped selectors not whole-page grep):
   the three hub links exist INSIDE home's lane section within `<main>`; the `<nav>` element on
   every page contains links to all three hubs and /faq/; home's `<main>` contains exactly one
   `<h1>` and one `<section>` and no other element types besides those and their children.

## Acceptance
1. `npm run test:t7` (with its new floor lines) exits 0; all other suites still exit 0.
2. Zero hardcoded hub-slug literals outside hubs.ts (rerun the t6 scan).
3. Commit `T6b: home lane-routing + nav completion` with T6b-CHECKPOINT.md and this file; status clean.

Do not do any work beyond T6b.
