# T13 — Teaser-to-token tool island: shell + contract only (supervised task)

Work ONLY on `dev`. Never touch `main`, never push. Existing tests extended-never-weakened.
NO editorial copy — neutral functional labels only.

## Context (binding)
This is a SHELL with a contract — deliberately not a live tool. No backend exists; building one,
or calling any endpoint, is out of scope by ratified decision. The island proves three things:
crawler-visible tool surface, a token gate that rejects everything, and a typed endpoint contract
v2 will honor.

## Build
1. **Config** `src/config/lab.ts`: the ONLY place any lab endpoint notion exists —
   `export const LAB_ENDPOINT: LabEndpoint = { name: "lab", version: "v1-contract-only" }` with a
   typed interface `LabEndpoint` (no URL field at all in v1 — the contract is deliberately
   URL-free until the lab architecture is ratified). A comment stating that.
2. **Island component** `src/components/ToolIsland.astro` placed on `/huntsville/` (below the
   market section) and `/` (below the lane section — this amends the T6b home-exactness floor:
   update that floor to h1 + lane section + this ONE island section):
   - Static-rendered `<form>` (crawler-visible in raw HTML): two neutral inputs
     (label "Loan amount", type number; label "Home value", type number) and a submit button
     labeled "Run analysis".
   - A small inline script intercepts submit: `preventDefault()`, calls a local
     `verifyToken()` stub that ALWAYS returns false, and renders the neutral message
     "Verification required. This tool is not yet live." into an aria-live region.
     NO network call of any kind, any origin. No fetch/XHR/sendBeacon/WebSocket anywhere in the
     island's code.
   - The form has NO action attribute (or action="#") and method="post" never fires (intercepted).
3. **Playwright** new `tests/island.spec.ts` + runner `tests/run-t13.sh` (same
   install-build-preview-test-cleanup pattern as run-t9), wired as the `test:t13` entry in
   package.json scripts (add it):
   a. On `/` and `/huntsville/`: form fields present in the RAW fetched HTML (crawler-visible).
   b. Fill both inputs, click submit: TOTAL network request-count delta across ALL origins = 0
      (record every request after page-load settles; assert none added by the submit).
   c. The aria-live message appears after submit.
   d. Source-level: grep the island component + lab.ts for fetch|XMLHttpRequest|sendBeacon|
      WebSocket|EventSource|WebTransport|import( → 0 hits; grep ALL of src/ for lab URL literals
      → 0 hits; AND a whole-session network assertion: across the ENTIRE page session (load +
      submit + 2s settle) the only request origins are the preview server's own (catches any
      request path, not just submit-time deltas).
   e. Placement + uniqueness: exactly ONE `data-tool-island` element per page, and on `/` it is
      inside `<main>` after the lane section; on `/huntsville/` after the market-link section;
      zero occurrences on any other page.
   f. The island root carries `data-tool-island` (this attribute is an ACCEPTANCE item, not just
      a build note).
4. **T18 pre-alignment**: the future T18 guardrail forbids capture elements outside this island —
   add a data attribute `data-tool-island` on the island's root so T18 can scope its exemption
   precisely. Update the T3-era capture-surface expectations in any existing test that asserts
   zero <form>/<input> in dist (they must now allow exactly the island's, identified by the
   attribute).

## Acceptance
1. `npm run test:t13` exits 0 (a–d PASS).
2. ALL suites + clean build still exit 0 (with the T6b home floor amended as specified).
3. Commit `T13: tool island shell + contract (reject-all token stub)` with T13-CHECKPOINT.md and
   this file; status clean.
Do not do any work beyond T13.
