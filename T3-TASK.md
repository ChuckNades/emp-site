# T3 — Base layout + core pages + SEO head + JSON-LD validator (supervised task 3)

Work ONLY in this repo on the checked-out `dev` branch. Never touch `main`, never push.
Do not modify src/assets/brand/, tests/fixtures/, hubs.ts or facts.ts values (import them),
or earlier T*-TASK/CHECKPOINT files.

## Context you need
- `src/data/facts.ts` holds canonical strings; empty strings are deliberate [FILL] placeholders —
  render them as empty (or conditionally omit the element), NEVER invent addresses, names, bios, or
  legal text. NMLS "55223" and licensureStates ["AL","TN","MS"] are real and usable.
- `src/content/people.json` holds the `pete` person entry (mostly placeholder-empty).
- Copy policy: you write NO marketing/editorial copy. Page structure, headings, and neutral
  functional labels only ("About", "Results", "Contact"). Personality ships later via sole authorship.

## Build

**1. Base layout** `src/layouts/Base.astro`:
- Semantic HTML5 shell (header/nav/main/footer), neutral minimal styling ONLY (system fonts, no
  colors beyond defaults, no design tokens — the identity system lands in a later task, T15b).
- Nav links: all §-known top routes (/, /about/, /results/, /contact/) — nothing else yet.
- SEO head on every page: exactly one canonical tag (from Astro.url against a SITE constant),
  title + meta description props, OG tags (og:title, og:description, og:type, og:url), and a
  JSON-LD slot.

**2. Site constant** `src/config/site.ts`: `SITE = "https://expertmortgagepro.com"` — single source.

**3. JSON-LD emitters** `src/lib/jsonld.ts`, typed with `schema-dts` (add as devDependency):
- `Organization` + `MortgageBroker` (name/address/areaServed from facts.ts — empty-safe),
- `BreadcrumbList` (from a path→label array),
- `ProfilePage` + `Person` (from the people `pete` entry + facts.ts: nmls, sameAs → NMLS Consumer
  Access URL).

**4. Four core pages** using Base:
- `/` — h1 "EMP" placeholder retained; emits Organization + MortgageBroker JSON-LD.
- `/about/` — structure only (empty bio section); emits ProfilePage + Person + BreadcrumbList.
- `/results/` — **empty state by design**: a single neutral line "Results are being compiled." and
  nothing else. NO outcomes, closings, numbers, or testimonials, ever. BreadcrumbList only.
- `/contact/` — renders office/licensure/NMLS strictly from facts.ts (empty fields render nothing);
  NOT a funnel: no form, no capture elements. MortgageBroker + BreadcrumbList.

**5. Validator script** `tests/validate-jsonld.mjs`, wired as `npm run test:jsonld`:
- Walks every built page in `dist/`, parses every `<script type="application/ld+json">` block.
- Asserts exactly ONE canonical link per page.
- Required-properties assertion map (fail on missing): MortgageBroker→name,address,areaServed ·
  Organization→name,url · BreadcrumbList→itemListElement(nonempty) · ProfilePage→mainEntity ·
  Person→name,sameAs. (Empty-string values from [FILL] fields are allowed present-but-empty EXCEPT
  areaServed which must equal exactly AL/TN/MS from facts.ts.)
- Exits nonzero listing failures; prints per-page PASS otherwise.

## Acceptance (verify before finishing)
1. `npm run build` exits 0; all four routes render in `dist/`.
2. `npm run test:jsonld` exits 0 with PASS for all four pages.
3. `npm run test:t2` still exits 0 (no schema regression).
4. `grep -ri "proudly serv\|apply now\|get a quote\|<form" dist/ | wc -l` is 0 (no invented
   service-area copy, no capture surfaces).
5. Commit `T3: base layout + core pages + SEO head + JSON-LD validator` with T3-CHECKPOINT.md
   (what was built + acceptance results); status clean after.

Do not do any work beyond T3.
