# R2 — Live-CI remediation (two findings from the first GitHub Actions run)

Work ONLY on `dev`. Never touch `main`. DO NOT PUSH. Fix exactly these two; no other changes.

1. **content.yml any-match bug.** GitHub `on.push.paths` triggers when ANY changed file matches;
   the ratified bypass requires EVERY changed file to be a content path. Rework: content.yml
   triggers on all dev pushes but its single job FIRST runs a changed-paths check (git diff
   --name-only against the before SHA, or dorny/paths-filter) and SKIPS (exits success with a
   "not content-only" notice, running nothing else) unless every changed path is under
   src/content/** or src/assets/content/**. ci.yml gets the inverse guard: its battery SKIPS when
   the push is content-only (the two lanes are mutually exclusive by commit, decided by the same
   rule). Update tests/run-t11.sh assertions to match the new mechanism.
2. **Timezone-unsafe sitemap dates.** test:t4 fails on UTC runners: page-dates.ts "2026-07-23"
   emits as 2026-07-22T00:00:00.000Z. Make the serialize hook and the T4 test timezone-proof:
   treat page-dates/frontmatter dates as calendar dates — emit lastmod as the plain date string
   (YYYY-MM-DD, no time component) so no TZ conversion can shift the day; update the test's
   comparison to date-string equality. Must pass with TZ=UTC and TZ=America/Chicago — run-t4
   asserts BOTH (run the check twice with TZ exported).

## Acceptance
`TZ=UTC npm run test:t4` AND `TZ=America/Chicago npm run test:t4` exit 0; `npm run test:t11`
exits 0; build + test:jsonld + test:t2 + test:t17 exit 0. Commit
`R2: live-CI fixes (bypass all-match, tz-safe lastmod)` with R2-CHECKPOINT.md and this file;
status clean. DO NOT PUSH — the reviewer pushes and re-proves on the live runners.
