# T13 Checkpoint — tool island shell + contract (reject-all token stub)

## What was built
- `src/config/lab.ts` — the ONLY place any lab endpoint notion exists. Typed
  `LabEndpoint` interface (`{ name: string; version: string }`) and
  `export const LAB_ENDPOINT: LabEndpoint = { name: 'lab', version:
  'v1-contract-only' }`. Deliberately URL-free in v1 (no URL field at all) —
  the contract stays URL-free until the lab architecture is ratified; a
  comment states that. No network primitive and no URL literal in the file.
- `src/components/ToolIsland.astro` — the island SHELL (deliberately not a
  live tool; no backend exists and none is called). Root
  `<section data-tool-island aria-labelledby="tool-island-heading">` carries
  the `data-tool-island` acceptance/scoping attribute. Inside it a
  static-rendered `<form method="post">` (NO action attribute) with two
  neutral number inputs — label "Loan amount" (`#loan-amount`), label "Home
  value" (`#home-value`) — and a submit button "Run analysis", so the tool
  surface is crawler-visible in the raw HTML. A small inline script intercepts
  submit: `preventDefault()`, calls a local `verifyToken()` stub that ALWAYS
  returns `false`, and renders the neutral message "Verification required.
  This tool is not yet live." into a `<p aria-live="polite"
  data-tool-island-status>` region. NO network call of any kind, to any origin
  — no fetch/XHR/sendBeacon/WebSocket/EventSource/WebTransport and no dynamic
  `import(` anywhere in the component (source grep = 0 hits).
- Placement: `src/pages/index.astro` renders `<ToolIsland />` below the lane
  section (inside `<main>`); `src/pages/huntsville.astro` renders it below the
  market-link section. Exactly ONE `data-tool-island` element per page, zero
  on any other page.

## Test amendments (extended, never weakened)
- `tests/check-links.mjs` — T6b home-exactness floor AMENDED as specified:
  home's `<main>` is now h1 + lane section + the ONE tool-island section.
  - Floor 7 (home lane section) now reads the `<section>` WITHOUT
    `data-tool-island` (the island added a second section).
  - Floor 9 (home `<main>` structure) now expects exactly 1 `<h1>`, 2
    `<section>` of which exactly 1 is `[data-tool-island]`, allows the island's
    children (h2/form/div/label/input/button/p), and allows the ONE bundled
    `<script>` Astro emits where the island component is used. Added an
    `innerOfSectionWith` helper.
- `tests/run-t5.sh` — T3-era capture-surface scan AMENDED: the ONE tool island
  (identified by `data-tool-island`) is exempt. The island `<section
  data-tool-island>…</section>` is stripped before the `<form`/`<input` grep,
  and more than one island root element on a geo page fails. Capture elements
  anywhere OUTSIDE the island still fail.

## New test wiring
- `tests/island.spec.ts` + `tests/run-t13.sh` (same
  install-build-preview-test-cleanup pattern as run-t9, port 44322) +
  `playwright.t13.config.ts` (testMatch `island.spec.ts`), wired as
  `npm run test:t13` in `package.json`. Asserts, on `/` and `/huntsville/`:
  - (a) form fields present in the RAW fetched HTML (crawler-visible);
  - (b) filling both inputs and clicking submit adds a TOTAL network
    request-count delta of 0 across ALL origins (every request recorded after
    page-load settles);
  - (c) the aria-live message appears after submit;
  - (d) source-level grep of the island + lab.ts for
    fetch(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|WebTransport|import(
    = 0 hits, grep of ALL src/ for lab URL literals = 0 hits, AND a
    whole-session network assertion: across the ENTIRE page session (load +
    submit + 2s settle) the only request origins are the preview server's own;
  - (e) placement + uniqueness: exactly ONE `data-tool-island` element per
    page, on `/` inside `<main>` after the lane section, on `/huntsville/`
    after the market-link section, and zero occurrences on every other built
    route;
  - (f) the island root carries `data-tool-island`.

## Acceptance results
1. `npm run test:t13` exits 0 — checks a–d (and e, f) PASS — PASS.
2. ALL suites + clean build still exit 0 with the T6b home floor amended:
   `test:jsonld`, `test:t2`, `test:t4`, `test:t5`, `test:t6`, `test:t7`,
   `test:t8`, `test:t9`, `test:t15a`, `test:t17` and a clean `npm run build`
   — PASS, no regressions.
3. Committed as `T13: tool island shell + contract (reject-all token stub)`
   with this checkpoint and the task file included; status clean after — PASS.
