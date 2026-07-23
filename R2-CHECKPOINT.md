# R2 Checkpoint — live-CI remediation

Two fixes for the findings from the first GitHub Actions run. Work done only
on `dev`; `main` untouched; nothing pushed. Exactly the two findings; no other
changes.

## What was fixed

1. **content.yml any-match bug.** GitHub `on.push.paths` fires when ANY
   changed file matches, but the ratified bypass requires EVERY changed file
   to be a content path. Both workflows now trigger on ALL dev pushes (and PRs
   into main) with NO `paths`/`paths-ignore` filters, and each job FIRST runs
   a changed-paths guard: `git diff --name-only` against the before SHA (PRs
   diff base..head; a brand-new branch's all-zero before SHA diffs against the
   empty tree). The guard greps for any changed path OUTSIDE `src/content/` or
   `src/assets/content/`:
   - `content.yml` runs its validate-only battery (build + test:t2) ONLY when
     every changed path is ratified content; otherwise the guard step exits 1
     and the rest of the job is skipped.
   - `ci.yml` runs the SAME check with the inverse polarity: it SKIPS the full
     battery (guard exits 1) exactly when the push is content-only.
   The two lanes are mutually exclusive by commit, decided by the same rule.
   `tests/run-t11.sh` assertions updated: both workflows must trigger on all
   dev pushes + PR main with no path filters, and both must embed the same
   all-match changed-paths guard (`git diff --name-only`, `github.event.before`,
   the two `^src/...` roots, and the `content-only` decision).

2. **Timezone-unsafe sitemap dates.** `test:t4` failed on UTC runners:
   page-dates `2026-07-23` emitted as `2026-07-22T00:00:00.000Z` (the sitemap
   stream coerces `lastmod` through `new Date(v).toISOString()`, and parsing a
   bare `YYYY-MM-DD` as UTC midnight can shift the day in a non-UTC build TZ).
   page-dates/frontmatter values are now treated as CALENDAR dates, not
   instants: `astro.config.mjs` adds a `calendarDate()` helper that anchors
   each date at UTC noon (`new Date('YYYY-MM-DDT12:00:00.000Z')`) before
   handing it to the serialize hook. UTC noon falls inside the same calendar
   day in every timezone (UTC±12), so the emitted lastmod's date prefix is
   identical regardless of build TZ — no TZ conversion can shift the day.
   `tests/run-t4.sh` is now timezone-proof: it dropped the TZ-dependent
   `TODAY=$(date +%F)` comparison in favor of date-STRING equality against the
   literal page-dates value (`2026-07-22`), and asserts every sitemap lastmod
   carries the TZ-stable calendar-date form (`YYYY-MM-DDT12:00:00.000Z`, date
   prefix = the calendar day).

## Acceptance results

- `TZ=UTC npm run test:t4` — PASS
- `TZ=America/Chicago npm run test:t4` — PASS
- `npm run test:t11` — PASS
- `npm run build` — PASS (16 pages)
- `npm run test:jsonld` — PASS
- `npm run test:t2` — PASS
- `npm run test:t17` — PASS

Committed as `R2: live-CI fixes (bypass all-match, tz-safe lastmod)` with this
checkpoint and `R2-REMEDIATION.md`; status clean after. DO NOT PUSH — the
reviewer pushes and re-proves on the live runners.
