# T17 Checkpoint — /market/huntsville/ market report page

## What was built
- `src/data/market/huntsville-seed.ts` — typed seed module, PUBLIC federal
  sources only, all values retrieved 2026-07-23 and hardcoded so the build
  stays offline. Each series carries `{label, unit, sourceName, sourceUrl,
  retrievedDate, rows:[{period, value}]}`. Four series:
  - FRED `ATNHPIUS26620Q` (All-Transactions HPI, Huntsville MSA, quarterly,
    index 1995:Q1=100) — last 10 quarters (2023 Q4 – 2026 Q1).
  - FRED `HUNT601URN` (Unemployment Rate, Huntsville MSA, monthly, NSA) — last
    5 calendar years (2021–2025), ANNUALIZED as the calendar-year average of
    the monthly values rounded to one decimal (rule stated in the module
    comment; 2025 averages its 11 reported months, Oct 2025 not yet reported).
    NOTE: the task brief named `HUNT101URN`; that id is retired — the current
    Huntsville MSA unemployment series id is `HUNT601URN`, verified at
    fred.stlouisfed.org/series/HUNT601URN.
  - Census ACS 5-year `B19013_001E` median household income, Madison County AL
    (GEO_ID 0500000US01089) — vintages 2022/2023/2024, values as published (no
    rounding), from the Census Bureau table-based summary files.
  - Census ACS 5-year `B01003_001E` total population, Madison County AL —
    vintages 2022/2023/2024, values as published.
  The Census data API now requires a key, so the exact ACS values were pulled
  from the keyless official summary files under
  `www2.census.gov/programs-surveys/acs/summary_file/<year>/table-based-SF/`;
  the 2024 values were cross-checked against Census Reporter (identical).
- `src/data/market/haar.ts` — `export const HAAR_ENABLED = false;` and an EMPTY
  typed placeholder `haarSeries: []` (no values). Comment records that enabling
  requires the data-licensing gate (PRD §8.17). No HAAR data exists in the repo.
- `src/lib/market-narrative.ts` — pure template function `marketNarrative`
  ("X rose/fell from A (start) to B (end).", with a "held steady" branch) plus
  a shared `formatMarketValue` used by BOTH the table cells and the sentence so
  a rendered value always matches the module (Percent/index render one decimal
  so 2.0 stays "2.0"; Dollars/Persons get thousands separators).
- `src/pages/market/huntsville.astro` — route `/market/huntsville/`, H1
  "Huntsville Market Report". One `<section>` per seed series: a real `<table>`
  (caption = label + unit, `<th scope="col">` headers), followed by exactly one
  narrative sentence from `marketNarrative`, followed by a source attribution
  line linking the series `sourceUrl`. Emits `Dataset` JSON-LD (name,
  description, creator=Organization, distribution omitted) + BreadcrumbList.
- `src/lib/jsonld.ts` — added `Dataset` to the `JsonLd` union and a
  `datasetJsonLd` emitter (creator = `organizationJsonLd()`, no distribution).
- `src/config/page-dates.ts` — added `/market/huntsville/` lastmod.
- `tests/check-links.mjs` — allowlist entry `/market/huntsville/` DELETED (the
  route now exists); the T7 floor still passes.
- `tests/check-t17.mjs` + `tests/run-t17.sh` wired as `npm run test:t17` —
  installs the valid fixture set (same `collection_for` mapping as run-t2),
  runs a FRESH `npm run build`, then asserts: (a) route renders with >=3
  `<table>` each having `<caption>` and `<th scope="col">`; (b) every numeric
  value in the value column exists in huntsville-seed.ts (module compiled from
  TS, values never re-hardcoded in the test); (c) zero "HAAR" case-insensitive
  in any dist/ file; (d) Dataset JSON-LD present with name/description/creator;
  (e) each series renders exactly one narrative sentence containing its first
  and last values and the page source imports market-narrative.ts; (e2) each
  series `sourceUrl` appears as an href; (f) the T7 link floor still passes.
- `package.json` — added `test:t17`.

## Acceptance results
1. `npm run test:t17` exits 0 — fixture build + route/tables/values/HAAR-grep/
   Dataset-JSON-LD/narrative/attribution + T7 link floor all PASS — PASS.
2. All prior suites exit 0: `test:jsonld`, `test:t2`, `test:t4`, `test:t5`,
   `test:t6`, `test:t7`, `test:t8`, `test:t9`, `test:t15a` — PASS, no
   regressions. Clean-repo `npm run build` exits 0 and the JSON-LD validator
   passes on the new page — PASS.
3. Committed as `T17: market report page (public-source seed, HAAR flag off)`
   with this checkpoint and the task file included; status clean after — PASS.
