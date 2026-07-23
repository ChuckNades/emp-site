# R1 Checkpoint — interim-review remediation

One fix pass over the five cross-vendor review findings. Work done only on
`dev`; `main` untouched; nothing pushed. Tests extended, never weakened.

## What was fixed

1. **[HIGH] Sitemap lastmod slug matching — `astro.config.mjs`.** Replaced the
   `path.includes(e.slug)` substring match with exact route matching. Each
   collection entry now carries its full expected `pathname`, precomputed at
   config scope: posts resolve under their owning hub slug (`category` ->
   hub route prefix via a `HUB_ROUTE_PREFIX` map kept in sync with
   `src/config/hubs.ts`, since this plain-.mjs scope cannot import the TS
   map); shownotes/videos resolve under their collection route prefix
   (`/podcast/`, `/videos/`). The serialize hook matches
   `e.pathname === path` exactly. REGRESSION TEST: two new valid fixtures
   `tests/fixtures/valid/post-alpha-fixture.mdx` (slug `alpha`,
   dateModified 2026-04-11) and `post-alpha-two-fixture.mdx` (slug
   `alpha-two`, dateModified 2026-05-17) whose slugs overlap as substrings;
   `tests/run-t4.sh` asserts each sitemap entry carries its OWN dateModified.

2. **[MED] JSON-LD injection.** Added ONE centralized helper
   `serializeJsonLd(obj)` in `src/lib/jsonld.ts` that serializes and escapes
   every `<` as `<` before injection. All 16 page templates that emit
   JSON-LD via `set:html` now use it (was `JSON.stringify`). REGRESSION TEST:
   new fixture `tests/fixtures/valid/post-jsonld-breakout-fixture.mdx` whose
   title contains `</script><script>alert(1)`; `tests/run-t2.sh` asserts the
   built page's JSON-LD payload contains NO literal `</script>`, contains the
   escaped `<\/script>` form, and still `JSON.parse`es.

3. **[MED] Nav landmark.** Global nav in `src/layouts/Base.astro` now has
   `aria-label="Main"`. Breadcrumb navs already carried
   `aria-label="Breadcrumb"`; the related nav `aria-label="Related"`; state
   pages `aria-label="City hubs"` — all landmarks distinctly labeled. TEST:
   `tests/check-links.mjs` floor 8 now also asserts the `<nav>` it inspects
   carries `aria-label="Main"`.

4. **[LOW] Facade focus.** In `src/components/MediaFacade.astro` `activate()`,
   the injected iframe gets `tabIndex = -1` and `.focus()` after the
   click-swap. TEST: `tests/facade.spec.ts` test b asserts
   `document.activeElement` is the `IFRAME` after click.

5. **[LOW] Link-checker relative hrefs.** `tests/check-links.mjs` floor 6 no
   longer skips relative hrefs: it resolves them against the page's own route
   (`new URL(href, 'https://local' + route).pathname`) and applies the same
   existence/fragment checks. No relative links exist today — the check
   guards the future.

## Incidental test bug unblocked (not a review finding)

`tests/run-t15a.sh` clause a (quarantine grep) was failing on a clean tree
before this pass: `T15a-CHECKPOINT.md` legitimately names the banned string
the quarantine-path string as a documentation literal but was not in the grep allowlist
(only `T15a-TASK.md` and the script itself were). Added
`T15a-CHECKPOINT.md` to the allowlist so the suite exits 0 as acceptance
requires. The grep still scans everything else; no assertion weakened.

## Acceptance results

All suites exit 0, including the three new regression assertions
(T4 overlap lastmod, T2 JSON-LD breakout escaping, T9 iframe focus):

- `npm run test:t2` — PASS (incl. JSON-LD breakout escaping)
- `npm run test:t4` — PASS (incl. overlap `/learn/alpha/` vs `/learn/alpha-two/`)
- `npm run test:t5` — PASS
- `npm run test:t6` — PASS
- `npm run test:t7` — PASS (incl. floor 8 `aria-label="Main"`)
- `npm run test:t8` — PASS
- `npm run test:t9` — PASS (5 playwright tests, incl. iframe focus)
- `npm run test:t15a` — PASS
- `npm run test:jsonld` — PASS
- clean `npm run build` — PASS (15 pages)

Committed as `R1: interim-review remediation (sitemap slug match, JSON-LD
escaping, a11y, focus, link checker)` with this checkpoint and
`R1-REMEDIATION.md`; status clean after.
