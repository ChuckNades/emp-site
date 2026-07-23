# T18 — Surface guardrails on the final dist (last build task)

Work ONLY on `dev`. Never touch `main`. DO NOT PUSH. Existing tests extended-never-weakened.

## Build
`tests/run-t18.sh` as `test:t18` — runs LAST, against a CLEAN production build (no fixtures):
1. **Exact route allowlist.** The set of built routes (every dist/**/index.html plus root files)
   equals EXACTLY: `/`, `/about/`, `/results/`, `/contact/`, `/faq/`, the three hub roots from
   hubs.ts, `/huntsville/`, `/birmingham/`, `/alabama/`, `/tennessee/`, `/mississippi/`,
   `/market/huntsville/`, `/podcast/`, `/videos/`, `/404` if Astro emits one, plus root artifacts
   (exact set: robots.txt, llms.txt, sitemap-index.xml + sitemap-0.xml, favicon.svg,
   favicon-32.png, apple-touch-icon.png, og-default.png, the one IndexNow key .txt whose name
   matches the committed public/ key file; `_astro/**` is the ONLY wildcard bucket allowed and
   only for extensions {css,js,webp,avif,svg,woff2}). Collection-derived child pages are allowed ONLY
   under their parents (learn/grow/become/podcast/videos slugs from non-draft entries — in a
   clean build there are none). ANY surplus route or file class = FAIL, listed by path.
2. **Capture elements.** Zero <form>/<input>/<textarea>/<select> in dist EXCEPT inside the
   single [data-tool-island] element per page where it appears (/, /huntsville/).
3. **areaServed.** Every areaServed value in any JSON-LD equals exactly the facts.ts licensure
   states; zero values outside it.
4. **No subscribe/newsletter surfaces.** Case-insensitive regex scan of dist HTML for
   `subscribe|newsletter|sign[ -]?up|mailing list` = 0 hits.
5. **Wire into ci.yml** as the final battery step (after test:t10) — and extend run-t11.sh's
   battery-completeness assertion so test:t11 FAILS if test:t18 is absent from ci.yml.

## Acceptance
1. `npm run test:t18` exits 0 with per-guardrail PASS lines; full suite list + clean build still 0.
2. Commit `T18: surface guardrails (route allowlist, capture, areaServed)` with T18-CHECKPOINT.md
   and this file; status clean. DO NOT PUSH.
Do not do any work beyond T18.
