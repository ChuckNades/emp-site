# T4 Checkpoint — robots.txt + sitemap lastmod + llms.txt

## What was built
- `public/robots.txt` — `User-agent: *` with `Allow: /` (zero `Disallow`
  directives for any user agent, per the ratified ruling) plus a `Sitemap:`
  line pointing at `https://expertmortgagepro.com/sitemap-index.xml`. Nothing
  else.
- `public/llms.txt` — Markdown: H1 `# Expert Mortgage Pro`, the single neutral
  sentence ("Authority resource for mortgage consumers, referral partners, and
  originators."), and exactly the three ratified pillar hub URLs
  (`/learn/`, `/grow/`, `/become/`, full URLs). Hub pages land in T6; the URLs
  are listed anyway. No invented content descriptions.
- `@astrojs/sitemap@3.7.3` (exact pin, compatible with astro 5.18.2) added as a
  dependency and wired in `astro.config.mjs` with `site` set from
  `src/config/site.ts`.
- `src/config/page-dates.ts` — `PAGE_DATES` mapping route → ISO date with
  exactly the four core routes (`/`, `/about/`, `/results/`, `/contact/`), all
  dated 2026-07-22 (build date; they diverge naturally from here).
- Sitemap `serialize` hook in `astro.config.mjs` — every emitted `<url>` entry
  carries a per-page `<lastmod>`:
  - Static/core pages: from `PAGE_DATES` (value-for-value per route).
  - Collection-driven pages (posts/shownotes/videos, when routes exist): the
    entry's `dateModified`, falling back to `datePublished`, matched by slug.
    `astro:content`'s `getCollection` is unavailable at config scope, so the
    hook reads the four needed frontmatter fields (`slug`, `draft`,
    `dateModified`, `datePublished`) directly from `src/content/**` at config
    load; drafts never contribute a lastmod. No single build-time stamp is
    applied anywhere.
- `tests/fixtures/valid/post-fixture-2.mdx` — second valid post whose
  `dateModified` (2026-03-05) differs from `post-fixture.mdx` (which has no
  `dateModified`, so its lastmod falls back to `datePublished` 2026-01-15).
- `tests/run-t4.sh` wired as `npm run test:t4` (nonzero exit on any failure):
  a. builds with the valid fixture set installed (install/cleanup mechanism
     reused from `tests/run-t2.sh`, fixtures removed via trap on exit);
  b. asserts `dist/robots.txt` exists with zero case-insensitive `Disallow`
     lines;
  c. asserts `dist/llms.txt` exists and lists exactly the three hub URLs;
  d. asserts the union of `<url>` entries across emitted sitemap files covers
     every `dist/**/index.html` exactly once, that the draft fixture
     (`post-draft-fixture`) appears in NO entry, and that every entry has
     `<lastmod>`;
  e. per-page lastmod proof: each core route's `<lastmod>` equals its
     `page-dates.ts` entry value-for-value, and each post fixture's expected
     lastmod equals its own `dateModified`/`datePublished` (post routes don't
     exist until T5+, so fixture assertions prove the expected values are
     derivable and distinct — a single global stamp cannot pass);
  f. prints per-check PASS lines; cleans up fixtures after.
- `.gitignore` — `.codex-tmp/` added (runtime dir of another tool; ignored,
  not committed).

## Acceptance results
1. `npm run test:t4` exits 0, all 11 PASS lines printed — PASS.
2. `npm run build` (clean repo) exits 0; `npm run test:jsonld` exits 0;
   `npm run test:t2` exits 0 — PASS, no regressions.
3. Committed as `T4: robots + sitemap lastmod + llms.txt` with this checkpoint
   included; status clean after (`.codex-tmp/` ignored, not committed) — PASS.
