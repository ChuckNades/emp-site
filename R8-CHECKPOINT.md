# R8: stage-5 final fixes (segmenter, workflow perms, inert island, headings, local date)

1. scripts/intake-transcript.mjs — naive punctuation-regex sentence splitter replaced with
   `Intl.Segmenter("en", { granularity: "sentence" })`, with a rejoin pass for segments ending in a
   common abbreviation (ICU breaks after "Dr." before an uppercase word). Paragraphs = the
   segmenter's sentences joined per original blank-line groups; blank lines are the ONLY paragraph
   boundaries. run-t12 extended: fixture gained sentences with "Dr. Smith", "3.5 percent", and an
   ellipsis… (in a second blank-line group); the test mirrors the segmenter split and asserts
   verbatim transport of all three within their paragraphs plus no reflow across the blank line.
2. .github/workflows/ci.yml + content.yml — top-level `permissions: contents: read` added to both.
   run-t11 extended to assert the block exists in both files and grants nothing else.
3. src/components/ToolIsland.astro — shell made inert without JS: `method="post"` removed (no
   action/method at all; a default GET onto self is still wrong), `onsubmit="return false"` set as
   the markup-level backstop, JS interceptor kept, and a `<noscript>` line added inside the island:
   "This tool requires JavaScript and is not yet live." island.spec raw-HTML check extended: no
   method=/action= on the island form, onsubmit backstop present, noscript line in the raw HTML.
4. src/pages/market/huntsville.astro — series section headings h3 → h2 (document order h1 → h2).
   No page-local styles were keyed to h3; global Base.astro h2/h3 element styles apply.
5. scripts/intake-transcript.mjs — datePublished now from the LOCAL calendar date
   (`Intl.DateTimeFormat('sv-SE')` → y-m-d), not the UTC ISO slice.

Acceptance: test:t12, test:t13, test:t11, test:jsonld, test:t15b, test:t17, test:t18, build all
exit 0 on dev. Not pushed.
