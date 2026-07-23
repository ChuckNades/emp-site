# R1 — Interim-review remediation (one fix list, one fix pass)

Work ONLY on `dev`. Never touch `main`, never push. Fix EXACTLY these five findings from the
cross-vendor code review — no other refactors, no scope creep. Extend tests, never weaken.

1. **[HIGH] astro.config.mjs — sitemap lastmod slug matching.** Replace the `path.includes(e.slug)`
   substring match with exact route matching: derive each entry's full expected pathname (owning
   hub slug + entry slug for posts; the collection's route prefix + slug for shownotes/videos) and
   compare against the sitemap item's pathname exactly. REGRESSION TEST: add to run-t4 two
   temporary fixture posts whose slugs overlap as substrings (e.g. `alpha` and `alpha-two`) with
   different dateModified values; assert each sitemap entry carries its OWN date.

2. **[MED] JSON-LD injection.** Everywhere JSON-LD is emitted via `set:html` (Base layout slot,
   page templates, article template): escape the serialized JSON with
   `.replace(/</g, "\\u003c")` before injection — centralize in ONE helper in `src/lib/jsonld.ts`
   (e.g. `serializeJsonLd(obj)`) and use it in every template. REGRESSION TEST: extend
   validate-jsonld or run-t2 with a fixture whose title contains `</script><script>alert(1)`
   and assert the built page contains NO literal `</script>` inside the JSON-LD payload and the
   JSON still parses (the escaped form).

3. **[MED] Nav landmark.** Give the global nav `aria-label="Main"`; the article breadcrumb nav
   `aria-label="Breadcrumb"`; any other nav landmarks distinct labels. TEST: add assertions to
   check-links.mjs floor 8 that the `<nav>` it inspects has `aria-label="Main"`.

4. **[LOW] Facade focus.** After the click-swap, move focus to the injected iframe (tabindex="-1"
   + .focus()) . TEST: extend facade.spec.ts — after click, `document.activeElement` is the iframe.

5. **[LOW] Link-checker relative hrefs.** Extend check-links.mjs to resolve and verify
   relative hrefs (resolve against the page's URL, then same existence checks). No relative links
   should exist today — the check guards the future.

## Acceptance
All suites (`test:t2` `test:t4` `test:t5` `test:t6` `test:t7` `test:t8` `test:t9` `test:t15a`
`test:jsonld` + clean build) exit 0, including the three new regression assertions. Commit
`R1: interim-review remediation (sitemap slug match, JSON-LD escaping, a11y, focus, link checker)`
with R1-CHECKPOINT.md and this file; status clean.
