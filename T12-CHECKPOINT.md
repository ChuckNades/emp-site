# T12 Checkpoint — dictate→MDX intake script

## What was built
- `tests/fixtures/transcript-sample.txt` — pinned fixture transcript: a
  `FIXTURE `-prefixed first line plus 10 sentences of neutral, content-free
  placeholder prose (a fake dictation about a generic weekly-review habit; no
  mortgage advice or claims).
- `scripts/intake-transcript.mjs`, wired as
  `npm run intake -- <transcript-path> [--category learn|partners|originators]`
  (default category `learn`). Reads the transcript and emits an MDX file into
  `src/content/posts/` that passes the T2 schema:
  - title: `FIXTURE: ` + first-line stub when the first line carries the
    `FIXTURE ` prefix (stub = first line minus the prefix, truncated at 80
    chars); otherwise the first line verbatim as the working title.
  - description: first sentence trimmed to ≤160 chars.
  - slug: kebab of the title — lowercase, non-alphanumerics → single hyphens,
    trimmed, max 60 chars — deduped with a numeric suffix (`-2`, `-3`, …) when
    the target file already exists (never clobbers).
  - datePublished: today (ISO date); author: pete; category from the flag;
    `draft: true` ALWAYS.
  - body: the transcript sentences as blank-line-separated paragraphs —
    VERBATIM transport (the only transforms are whitespace normalization and
    paragraph breaks; no summarization, no rewriting, no added copy).
- `tests/run-t12.sh`, wired as `npm run test:t12`. Runs the intake on the
  pinned fixture and asserts: (a) the emitted file exists in
  `src/content/posts/`, carries `draft: true` + a `FIXTURE: ` title, and a
  production build with it present exits 0 (schema-valid); (b) 100% of the
  transcript's sentences appear verbatim in the emitted body, in order, as the
  ONLY body content (a canned or rewriting script fails); (c) in the
  production `dist/` neither draft page URL has a built file (direct-path
  check on `dist/learn/<slug>/index.html`), no dist HTML links to either
  draft (hub-list exclusion), and no `sitemap-*.xml` entry names either slug;
  (d) a second intake run emits the suffixed slug without clobbering the
  first; (e) both emitted files are removed afterward (trap on EXIT), leaving
  the repo clean.
- `package.json` — added `intake` and `test:t12` scripts.
- `.github/workflows/ci.yml` — added the `test:t12` gate step (T11 requires
  every `test:*` script to appear as a named ci.yml step).

## Acceptance results
1. `npm run test:t12` exits 0 — all nine per-check PASS lines (wiring, first
   emit, suffixed second emit, frontmatter, verbatim transport, schema-valid
   production build, direct-path draft exclusion, hub-list exclusion, sitemap
   exclusion) — PASS. Full suite `test:jsonld t2 t4 t5 t6 t7 t8 t11 t15a t17`
   and a clean-repo `npm run build` all exit 0 — PASS.
2. Committed as `T12: dictate-to-MDX intake script` with this checkpoint and
   `T12-TASK.md`; status clean after — PASS.

DO NOT PUSH — the reviewer pushes.
