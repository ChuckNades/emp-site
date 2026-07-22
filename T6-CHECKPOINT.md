# T6 Checkpoint — pillar hubs + cluster templates + FAQ hub

## What was built
- `src/config/hubs.ts` — extended (still the ONLY place hub slugs exist):
  added `HUB_LABELS` (learn→"Learn", partners→"Grow", originators→"Become"),
  `HUB_PARAMS` (bare route params derived from `HUB_SLUGS`), and
  `hubCategoryForParam()` (param → category lookup for the article route).
- `src/pages/[hub]/index.astro` — pillar hub pages `/learn/`, `/grow/`,
  `/become/` from one `getStaticPaths` over `HUB_CATEGORIES`; zero hardcoded
  slug strings. H1 = the hub's `HUB_LABELS` label. A post is listed when its
  `category` OR its `alsoRelevantTo` includes the hub key; cross-listed posts
  link to the SAME canonical owning-hub URL (`HUB_SLUGS[category] + slug`).
  Drafts excluded in production builds. Emits `BreadcrumbList` (home → hub).
- `src/pages/[hub]/[slug].astro` — cluster article route. One canonical route
  per post, under its OWNING hub (`category`) only — `alsoRelevantTo` never
  creates a second route. Non-hub params and slug mismatches return 404.
  Renders title/body via Base layout; emits `Article` JSON-LD (headline,
  datePublished, dateModified with datePublished fallback applied, author →
  the `people` pete entry via `personJsonLd()`), `BreadcrumbList`
  (home → owning hub → article), and `FAQPage` JSON-LD when the post carries
  embedded `faq` pairs. Canonical tag = the owning-hub URL (Base layout
  default, since the route IS the canonical URL).
- `src/pages/faq.astro` — `/faq/` hub: every non-draft `faqs` entry rendered
  visibly (`<h2>` question + answer paragraph) plus ONE `FAQPage` JSON-LD
  whose mainEntity is all Q/A pairs, and a `BreadcrumbList`.
- `src/lib/jsonld.ts` — added `articleJsonLd()` (dateModified falls back to
  datePublished; author is always the pete Person node) and `faqPageJsonLd()`
  (shared by articles with embedded faqs and the /faq/ hub); `JsonLd` union
  extended with `Article | FAQPage`.
- `src/config/page-dates.ts` — the three hub routes (keyed by `HUB_SLUGS`
  computed keys, not literals) and `/faq/` added so their sitemap entries
  carry `<lastmod>`.
- `astro.config.mjs` — fixed the sitemap serialize hook's `frontmatterValue`
  regex: it used the POSIX class `[[:space:]]` inside a JS `RegExp`, which
  never matches, so no collection entry ever received a `<lastmod>`. Latent
  until T6 created the first post routes; now `\s`, and post entries get
  dateModified/datePublished lastmods as T4 intended.
- `tests/validate-jsonld.mjs` — extended (add-only): `Article` requires
  headline/author/datePublished/dateModified (fallback applied = present) and
  `FAQPage` requires an array mainEntity; cluster pages (`/{hub}/{slug}/`,
  prefixes kept in sync with hubs.ts) must contain Article + BreadcrumbList
  and their canonical link must equal the owning-hub URL; `/faq/` must
  contain FAQPage whose mainEntity count equals the number of visibly
  rendered `<h2>` questions (nonempty whenever questions render). The
  nonempty check lives on /faq/ rather than globally because a clean-repo
  /faq/ hub legitimately has zero entries.
- `tests/fixtures/valid/post-crosslane-fixture.mdx` — `category: partners`
  with `alsoRelevantTo: [originators]`, distinct ISO dates, author `pete`,
  neutral placeholder body.
- `tests/run-t6.sh` wired as `npm run test:t6` (nonzero on any failure):
  a. zero `"/learn/"`/`"/grow/"`/`"/become/"` literals in `src/**` outside
     `src/config/hubs.ts` (public/llms.txt is static and exempt);
  b. `category: learn` fixture listed on `/learn/` with its article link;
  c. crosslane fixture listed on BOTH `/grow/` and `/become/`, exactly ONE
     article route (under `/grow/`), canonical tag equals the grow URL, and
     the become list links to that same canonical URL;
  d. draft fixture on no hub list, no article route (production build);
  e. `/faq/` renders the faq fixture's question and answer; rendered `<h2>`
     count equals installed non-draft faq fixture count; exactly one FAQPage
     JSON-LD with matching mainEntity count;
  f. `npm run test:jsonld` passes over the fixture-installed build;
  g. cleanup via trap on exit.
- No editorial copy written — neutral labels and collection-driven content
  only; no capture elements.

## Acceptance results
1. `npm run test:t6` exits 0, all 11 PASS lines printed — PASS.
2. Clean-repo `npm run build` exits 0 (13 pages); `npm run test:jsonld`
   exits 0 (13 pages, all PASS); `npm run test:t2`, `npm run test:t4`,
   `npm run test:t5` all exit 0 — PASS, no regressions.
3. Committed as `T6: pillar hubs + cluster templates + FAQ hub` with this
   checkpoint included; status clean after — PASS.
