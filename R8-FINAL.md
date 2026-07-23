# R8 — Stage-5 final fix list (one pass; Codex confirms after). Work ONLY on dev. DO NOT PUSH.
Fix exactly these five; extend tests, never weaken.

1. [HIGH] scripts/intake-transcript.mjs — replace the naive punctuation-regex sentence splitter
   with `Intl.Segmenter("en", { granularity: "sentence" })`; paragraphs = the segmenter's
   sentences joined per original blank-line groups (blank lines in the transcript are the ONLY
   paragraph boundaries; sentences never reflow across them). Extend run-t12: add fixture
   sentences containing "Dr. Smith", "3.5 percent", and an ellipsis…; assert verbatim transport
   preserves them within their paragraphs.
2. [HIGH] .github/workflows/ci.yml + content.yml — add top-level `permissions: contents: read`
   to both workflows (no job needs more; the notify/indexnow stubs need none). Extend run-t11 to
   assert the permissions block exists in both files.
3. [MED] src/components/ToolIsland.astro — make the shell inert without JS: remove
   `method="post"` (default GET onto self is still wrong — remove action/method entirely and
   set `onsubmit="return false"` as markup-level backstop), keep the JS interceptor; add a
   `<noscript>` line inside the island: "This tool requires JavaScript and is not yet live."
   Extend island.spec/t13 raw-HTML check: no method= or action= attribute on the island form.
4. [LOW] src/pages/market/huntsville.astro — series section headings h3 → h2 (document order
   h1 → h2); adjust any styles keyed to those headings.
5. [LOW] scripts/intake-transcript.mjs — datePublished from LOCAL calendar date (Intl/DateTimeFormat
   sv-SE or manual y-m-d from local time), not UTC ISO slice.

Acceptance: test:t12, test:t13, test:t11, test:jsonld, test:t15b, test:t17, test:t18, build all
exit 0. Commit `R8: stage-5 final fixes (segmenter, workflow perms, inert island, headings, local date)`
with R8-CHECKPOINT.md and this file; status clean. DO NOT PUSH.
