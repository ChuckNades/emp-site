# T2 Checkpoint — Content collections + schema enforcement

## What was built
- `src/config/hubs.ts` — single source of truth: `HUB_CATEGORIES`
  (`['learn', 'partners', 'originators'] as const`), `HubCategory` type, and
  `HUB_SLUGS` map (`learn → /learn/`, `partners → /grow/`, `originators → /become/`).
  No other file hardcodes hub slugs.
- `src/data/facts.ts` — canonical facts module with typed constants:
  `legalName: ""`, `nmls: "55223"`, `nmlsConsumerAccessUrl`, empty `[FILL]`
  placeholders (`huntsvilleAddress`, `birminghamAddress`, `licensureStatement`,
  `podcastHostDomain`), and `licensureStates: ["AL", "TN", "MS"] as const`.
- `src/content.config.ts` — five Astro 5 content-layer collections with zod schemas:
  - `posts` (glob, md/mdx): required `title, description, slug, datePublished,
    author (reference to people), category (z.enum from HUB_CATEGORIES)`;
    optional `dateModified, alsoRelevantTo (same enum array), tags, image,
    faq ({question, answer}[]), draft (default false)`. Dates validated via
    `z.string().date()` (ISO-8601).
  - `faqs` (glob, md/mdx): required `question, answer`; optional `tags, draft`.
  - `shownotes` (glob, md/mdx): required `title, description, slug, datePublished,
    episodeNumber (number)`; optional `dateModified, youtubeId, image, draft`.
  - `videos` (glob, md/mdx): required `title, description, slug, datePublished,
    youtubeId`; optional `image, draft`.
  - `people` (data collection, `file()` loader on `src/content/people.json`):
    `name, jobTitle, nmls, sameAs (URL strings), image`. Single real entry `pete`
    with `nmls: "55223"` matching facts.ts; other fields placeholder-empty.
- `@astrojs/mdx@4.3.14` installed (4.x is the line peer-compatible with
  `astro@5`) and registered in `astro.config.mjs` — required so `.mdx` entries
  are parsed and schema-validated by the glob loader.
- Fixtures at `tests/fixtures/` (all titles prefixed `FIXTURE:`, bodies one
  neutral placeholder sentence):
  - `valid/`: `post-fixture.mdx` (omits `alsoRelevantTo`), `faq-fixture.md`,
    `shownotes-fixture.md`, `videos-fixture.md`, `post-draft-fixture.mdx`
    (`draft: true`).
  - `invalid/`: `missing-datePublished.mdx`, `bad-category.mdx`,
    `bad-alsoRelevantTo.mdx`, `faq-missing-answer.md`,
    `shownotes-missing-episodeNumber.md`, `videos-missing-youtubeId.md`.
- `tests/run-t2.sh` — installs valid fixtures into `src/content/<collection>/`,
  asserts build exits 0; greps `dist/` for the draft fixture's slug and title
  (0 hits required); then installs each invalid fixture alone with the valid set
  and asserts nonzero build exit; removes installed fixtures afterward (trap on
  EXIT). Wired as `npm run test:t2`.

## Acceptance results
1. `npm run test:t2` exits 0 with per-check PASS lines — PASS
   (valid build, draft exclusion, and all 6 invalid cases each PASS).
2. `npm run build` exits 0 on the clean repo (only `src/content/people.json`
   present, no fixtures installed) — PASS.
3. `git add -A && git commit -m "T2: content collections + schema enforcement"` —
   status clean after commit — PASS.
4. This checkpoint file written and included in the commit — PASS.
