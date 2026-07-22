# T9 — Lazy-load media facades + media pages (supervised task 9)

Work ONLY in this repo on the checked-out `dev` branch. Never touch `main`, never push.
Do not modify src/assets/brand/ or earlier T*-TASK/CHECKPOINT files. Existing tests may be
extended, never weakened. Copy policy as before: no editorial copy; structure + collection-driven
content only.

## Build

**1. Media routes** (collection-driven, Base layout, sitemap dates via frontmatter):
- `/podcast/` — lists non-draft `shownotes` entries (title + link). `/podcast/[slug]/` — episode
  page: title, body, lazy podcast-player facade ONLY if the entry has a player reference.
  `facts.podcastHostDomain` is the LITERAL empty-string constant `podcastHostDomain: ""` in
  `src/data/facts.ts` (read it) — when it is `""`, the facade renders a disabled placeholder
  button with zero external references; when non-empty (future), the facade pattern applies.
- `/videos/` — lists non-draft `videos` entries. `/videos/[slug]/` — video page with a YouTube
  facade for the entry's `youtubeId`.

**2. The facade component** `src/components/MediaFacade.astro`:
- Initial HTML contains NO `<script src>`, NO `<iframe>`, and NO reference to youtube.com/ytimg.com/
  youtube-nocookie.com or the podcast host — just a styled button/thumbnail placeholder with a
  small inline script.
- On click (interaction, not scroll), the inline script swaps in the real
  `youtube-nocookie.com/embed/{id}` iframe.
- `<noscript>`: a plain external link to `https://www.youtube.com/watch?v={id}` (this is the ONE
  allowed youtube.com string in initial HTML — inside `<noscript>` only, per the indexing
  requirement).
- Video pages emit `VideoObject` JSON-LD: name, description, thumbnailUrl
  (`https://i.ytimg.com/vi/{id}/hqdefault.jpg` — markup value, not a fetched asset), uploadDate
  (from datePublished), and **`embedUrl`** (never contentUrl).

**3. Playwright test** `tests/facade.spec.ts` + minimal playwright config, wired as `npm run test:t9`
(script installs the EXISTING media fixtures `tests/fixtures/valid/shownotes-fixture.md` and
`tests/fixtures/valid/videos-fixture.md` via the run-t2 mechanism, builds, runs `astro preview` on
a port, runs playwright against it, cleans up; install `@playwright/test` + chromium as devDependency):
a. On a video fixture page BEFORE any interaction: **zero network requests** to youtube.com,
   ytimg.com, youtube-nocookie.com, or the podcast host domain (request-interception count = 0).
b. AFTER clicking the facade: **≥1 request** to youtube-nocookie.com (the embed actually loads —
   an inert facade fails).
c. Initial HTML (fetch, not browser): no `<iframe>`, no embed-domain strings outside `<noscript>`
   and the JSON-LD thumbnailUrl/embedUrl values.
d. `VideoObject` JSON-LD present with `embedUrl` and NO `contentUrl`.
e. Route wiring: `/podcast/` lists the shownotes fixture's title and `/podcast/<its-slug>/` renders;
   `/videos/` lists the videos fixture and `/videos/<its-slug>/` renders; with `podcastHostDomain`
   empty, the episode page contains the disabled placeholder and ZERO external media-domain strings;
   both new route families appear in the sitemap with `<lastmod>`.

**4. Extend `tests/validate-jsonld.mjs`**: VideoObject→name,thumbnailUrl,uploadDate,embedUrl
required on video pages (when they exist in the build).

## Acceptance
1. `npm run test:t9` exits 0 (a/b/c/d PASS lines).
2. Clean-repo `npm run build` + all prior suites still exit 0.
3. Commit `T9: media facades + video/podcast routes` with T9-CHECKPOINT.md AND this task file;
   status clean.

Do not do any work beyond T9.
