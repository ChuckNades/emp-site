# T17 — /market/huntsville/ market report page (supervised task, closes the parallel band)

Work ONLY on `dev`. Never touch `main`, never push. Existing tests extended-never-weakened.

## Context (binding)
This page is the site's flagship citation asset. It launches seeded from PUBLIC federal sources
only. A licensed private dataset (HAAR) exists but its licensing is NOT cleared: HAAR-derived
figures may exist ONLY behind a build flag that defaults OFF, and while off, zero HAAR-sourced
values may appear in dist/. You do not have HAAR data and must not invent any — the flag guards
an EMPTY placeholder module today.

## Build
1. **Seed data module** `src/data/market/huntsville-seed.ts`: typed series with REAL values you
   fetch NOW from public sources (build stays offline — you hardcode the fetched values into the
   module with per-series source URLs + retrieval date):
   - FRED series ATNHPIUS26620Q (Huntsville MSA house price index) — last ~10 annual values.
   - FRED series HUNT101URN or the current Huntsville MSA unemployment series — last ~5 values,
     **annualized as the calendar-year average of monthly values, rounded to one decimal** (state
     the rule in the module comment).
   - Census/ACS **5-year estimates**: Madison County median household income (table B19013) +
     total population (B01003), the 2-3 most recent vintages, values as published (no rounding).
   If a series id above is wrong/renamed, find the correct current id on fred.stlouisfed.org and
   record what you used. Every series entry: {label, unit, sourceName, sourceUrl, retrievedDate,
   rows: [{period, value}]}.
2. **HAAR flag module** `src/data/market/haar.ts`: `export const HAAR_ENABLED = false;` and an
   EMPTY typed placeholder (`haarSeries: [] — no values`). A comment: enabling requires the data-
   licensing gate (PRD §8.17).
3. **Page** `/market/huntsville/` (add route via a `market/huntsville.astro` or nested index —
   route must match exactly): H1 "Huntsville Market Report". For each seed series: a real HTML
   `<table>` (caption = label + unit, `<th scope>` headers) followed by ONE plain machine-
   extractable narrative sentence generated from the data by a pure template function
   (`src/lib/market-narrative.ts`: "X rose/fell from A (start period) to B (end period).") —
   template-generated data rendering, NOT editorial copy. Per-series source attribution line
   linking the sourceUrl. Emits `Dataset` JSON-LD (name, description, creator=Organization,
   distribution omitted) + BreadcrumbList. Page date in page-dates.ts.
4. **Test** `tests/run-t17.sh` as `npm run test:t17`:
   a. Route renders; contains ≥3 `<table>` elements each with a `<caption>` and `<th scope="col">`.
   b. Every displayed numeric value in the tables exists in huntsville-seed.ts (extract + compare)
      — no value appears on the page that is not in the module.
   c. Zero occurrences of "HAAR" (case-insensitive) in ANY file under dist/ — HTML, JS, JSON,
      XML, txt (flag off ⇒ nothing HAAR-sourced or labeled anywhere in build output).
   d. Dataset JSON-LD present; validator required-props (name, description, creator) pass.
   e. Each series renders exactly one narrative sentence whose text contains the series' first
      and last values; `market/huntsville` page source imports `market-narrative.ts` (source-level
      grep — sentences come from the template function, not hardcoded prose).
   e2. Each series' `sourceUrl` from the module appears as an `href` on the built page
      (attribution is rendered, not just stored).
   f. The T7 link floor still passes with /market/huntsville/ now REMOVED from the allowlist
      (update check-links.mjs: the route now exists — allowlist entry deleted).
## Acceptance
1. `npm run test:t17` exits 0; ALL suites + clean build still exit 0 (t7 allowlist updated).
2. Commit `T17: market report page (public-source seed, HAAR flag off)` with T17-CHECKPOINT.md
   and this file; status clean.
Do not do any work beyond T17. If you cannot verify a real value for a series, include fewer
series (minimum 3 tables can include two FRED + one Census) — never estimate or invent a number.
