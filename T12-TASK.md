# T12 — Dictate→MDX intake script (supervised task)

Work ONLY on `dev`. Never touch `main`. DO NOT PUSH. Existing tests extended-never-weakened.

## Build
1. **Fixture transcript** `tests/fixtures/transcript-sample.txt`: 8-12 sentences of NEUTRAL
   placeholder prose (a fake dictation about a generic, content-free topic — "FIXTURE" prefixed
   first line; invent no mortgage advice/claims).
2. **Intake script** `scripts/intake-transcript.mjs` wired as
   `npm run intake -- <transcript-path> [--category learn|partners|originators]`:
   - Reads the transcript, emits an MDX file into `src/content/posts/` that passes the T2 schema:
     frontmatter title = `FIXTURE: ` + first-line-derived stub when input is the fixture
     (real transcripts later: first line becomes the working title, still `draft: true`),
     description = first sentence trimmed to ≤160 chars, slug from the title (kebab, deduped
     with a numeric suffix if the file exists — normalization pinned: lowercase, non-alphanumerics
     → single hyphens, trimmed, max 60 chars; title stub = first line minus the FIXTURE prefix,
     truncated at 80 chars), datePublished = today (ISO date), author = pete,
     category from the flag (default learn), draft = true ALWAYS.
   - Body: the transcript sentences as paragraphs (blank-line separated). NO summarization, NO
     rewriting, NO added copy — verbatim transport into MDX (Pete edits afterward; the tool moves
     text, it does not author).
3. **Test** `tests/run-t12.sh` as `test:t12`:
   a. Run the intake on the pinned fixture; the emitted file exists in src/content/posts/ and
      passes a build (schema-valid) with draft:true and FIXTURE: title.
   b. 100% of the transcript's sentences appear verbatim in the emitted body, in order (the tool
      is transport, not editing — the only permitted transforms are whitespace normalization and
      paragraph breaks). A canned or rewriting script fails.
   c. In a production build: the emitted page's URL returns no built file in dist/ (direct-path
      check, not just listings), and it appears in no hub list or sitemap entry.
   d. Running intake twice doesn't clobber: second run emits a suffixed slug.
   e. Cleanup: remove emitted files after.

## Acceptance
1. `npm run test:t12` exits 0; full suite list + clean build still exit 0
   (test:jsonld t2 t4 t5 t6 t7 t8 t11 t15a t17).
2. Commit `T12: dictate-to-MDX intake script` with T12-CHECKPOINT.md and this file; status clean.
Do not do any work beyond T12.
