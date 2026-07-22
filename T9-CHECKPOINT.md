# T9 Checkpoint — media facades + video/podcast routes

## What was built
- `src/components/MediaFacade.astro` — lazy media facade. Initial HTML
  contains NO `<script src>`, NO `<iframe>`, and NO youtube.com/ytimg.com/
  youtube-nocookie.com/podcast-host reference — only a styled placeholder
  button plus a small inline src-less script (a `media-facade` custom
  element). On click (interaction, not scroll) the handler assembles the
  `youtube-nocookie.com/embed/{id}` URL from string parts (so the domain
  never appears in served markup) and swaps the button for the real iframe.
  The ONE allowed youtube.com string in initial HTML lives inside
  `<noscript>` (a plain external watch link). With no `youtubeId` (the
  podcast facade while `facts.podcastHostDomain` is the `""` [FILL]) it
  renders a disabled placeholder button with zero external references.
- `src/pages/podcast/index.astro` + `src/pages/podcast/[slug].astro` —
  collection-driven: the index lists every non-draft `shownotes` entry
  (title + link); the episode page renders title, body, and the podcast
  facade (disabled placeholder while the host domain is empty). Base layout,
  BreadcrumbList JSON-LD.
- `src/pages/videos/index.astro` + `src/pages/videos/[slug].astro` — the
  index lists every non-draft `videos` entry; the video page renders title,
  the YouTube facade for the entry's `youtubeId`, body, and `VideoObject`
  JSON-LD: name, description, thumbnailUrl
  (`https://i.ytimg.com/vi/{id}/hqdefault.jpg` — markup value, never a
  fetched asset), uploadDate (from datePublished), and `embedUrl` (never
  `contentUrl`).
- `src/lib/jsonld.ts` — added `videoJsonLd()` (schema-dts `VideoObject`);
  `JsonLd` union extended.
- `src/config/page-dates.ts` — added `/podcast/` and `/videos/` so both
  index routes carry `<lastmod>` in the sitemap (entry pages resolve dates
  from frontmatter via the existing serialize hook).
- `tests/validate-jsonld.mjs` — extended: `VideoObject` requires
  name/thumbnailUrl/uploadDate/embedUrl on `/videos/<slug>/` pages (when
  they exist in the build), and `contentUrl` is asserted absent.
- `tests/facade.spec.ts` + `playwright.config.ts` + `tests/run-t9.sh`
  (wired as `npm run test:t9`) — installs the existing media fixtures via
  the run-t2 `collection_for` mechanism, builds, serves `dist/` via
  `astro preview` on port 44321, runs playwright, cleans up fixtures and
  the server via trap. Checks: (a) zero media-domain requests before
  interaction, (b) clicking the facade loads ≥1 youtube-nocookie request,
  (c) initial HTML has no `<iframe>`, no `<script src>`, no embed-domain
  strings outside `<noscript>`/JSON-LD, (d) VideoObject JSON-LD with
  embedUrl and no contentUrl, (e) route wiring + sitemap `<lastmod>` for
  both route families.
- `tests/check-images.mjs` — extended (not weakened): clause a strips
  JSON-LD blocks before the reference scans, because the VideoObject
  thumbnailUrl is a schema.org markup value, not a fetched asset; the T9
  suite pins its exact value. All other scans unchanged.
- `package.json` — added `test:t9`; `@playwright/test` added as a
  devDependency (chromium browser installed via `npx playwright install
  chromium`).

## Environment note
Chromium's runtime shared libraries (libnspr4/libnss3/libasound) are not
installed system-wide on this machine and there is no sudo access, so the
.deb payloads are extracted locally under `.codex-tmp/pw-libs/` (git-ignored
scratch dir) and `tests/run-t9.sh` exposes them to the browser via
`LD_LIBRARY_PATH`. On a machine with the standard playwright system deps
this is a no-op.

## Acceptance results
1. `npm run test:t9` exits 0 — fixture build PASS + playwright a/b/c/d/e
   all PASS (5 passed) — PASS.
2. Clean-repo `npm run build` exits 0 (15 pages); `npm run test:jsonld`,
   `npm run test:t2`, `npm run test:t4`, `npm run test:t5`,
   `npm run test:t6`, `npm run test:t7`, `npm run test:t8` all exit 0 —
   PASS, no regressions.
3. Committed as `T9: media facades + video/podcast routes` with this
   checkpoint and the task file included; status clean after — PASS.
