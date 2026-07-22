# T3 Checkpoint — Base layout + core pages + SEO head + JSON-LD validator

## What was built
- `src/config/site.ts` — `SITE = "https://expertmortgagepro.com"`, single source
  for the canonical origin.
- `src/layouts/Base.astro` — semantic HTML5 shell (header/nav/main/footer) with
  neutral minimal styling only (no colors, no design tokens; identity lands in
  T15b). Nav links exactly the four known top routes (`/`, `/about/`,
  `/results/`, `/contact/`). SEO head on every page: exactly one canonical tag
  (`new URL(Astro.url.pathname, SITE)`), `title` + meta description props, OG
  tags (`og:title`, `og:description`, `og:type`, `og:url`), and a named
  `jsonld` slot.
- `src/lib/jsonld.ts` — schema-dts-typed emitters, all values imported from
  `src/data/facts.ts` and the `people` collection (empty `[FILL]` strings
  render empty, never invented):
  - `organizationJsonLd()` — `Organization` (name, url).
  - `mortgageBrokerJsonLd()` — `MortgageBroker` (name, url, address joined from
    the two office address facts, `areaServed` = `licensureStates` AL/TN/MS).
  - `breadcrumbJsonLd(items)` — `BreadcrumbList` from a `{path, label}[]` array
    with absolute `item` URLs.
  - `personJsonLd()` — `Person` from the `pete` people entry plus facts.ts:
    `identifier` = NMLS "55223", `sameAs` includes the NMLS Consumer Access URL.
  - `profilePageJsonLd(path)` — `ProfilePage` with `mainEntity` = that Person.
- Four core pages using Base:
  - `/` — h1 "EMP" placeholder retained; emits Organization + MortgageBroker.
  - `/about/` — structure only (empty bio section); emits ProfilePage + Person
    + BreadcrumbList.
  - `/results/` — empty state by design: single neutral line "Results are being
    compiled." and nothing else; BreadcrumbList only.
  - `/contact/` — office/licensure/NMLS rendered strictly from facts.ts (empty
    fields render nothing); no form, no capture elements; MortgageBroker +
    BreadcrumbList.
- `tests/validate-jsonld.mjs` wired as `npm run test:jsonld` — walks every
  built page in `dist/`, parses every `<script type="application/ld+json">`
  block (handles arrays and `@graph`), asserts exactly ONE canonical link per
  page, and enforces the required-properties map: MortgageBroker→name,address,
  areaServed · Organization→name,url · BreadcrumbList→itemListElement(nonempty)
  · ProfilePage→mainEntity · Person→name,sameAs. Empty-string values allowed
  except `areaServed`, which must equal exactly `["AL","TN","MS"]`. Exits
  nonzero listing failures; prints per-page PASS otherwise.
- `schema-dts@^2.0.0` added as devDependency.

## Acceptance results
1. `npm run build` exits 0; all four routes render in `dist/`
   (`index.html`, `about/index.html`, `results/index.html`,
   `contact/index.html`) — PASS.
2. `npm run test:jsonld` exits 0 with PASS for all four pages — PASS.
3. `npm run test:t2` exits 0 (valid build, draft exclusion, all 6 invalid
   cases) — PASS, no schema regression.
4. `grep -ri "proudly serv\|apply now\|get a quote\|<form" dist/ | wc -l`
   prints 0 — PASS (no invented service-area copy, no capture surfaces).
5. Committed as `T3: base layout + core pages + SEO head + JSON-LD validator`
   with this checkpoint included; status clean after — PASS.
