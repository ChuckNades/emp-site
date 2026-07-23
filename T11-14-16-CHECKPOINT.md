# T11+T14+T16 Checkpoint — CI pipeline, alert stub, IndexNow stub

## What was built
- `.github/workflows/ci.yml` — full gate pipeline. Triggers: push to `dev`
  and PRs into `main`, with `paths-ignore` on both for the ratified
  content/media bypass paths (`src/content/**`, `src/assets/content/**`).
  Job `gate` on ubuntu-latest / Node 22: `npm ci`,
  `npx playwright install --with-deps chromium`, then the full battery as
  separate named steps — build, test:jsonld, test:t2, test:t4, test:t5,
  test:t6, test:t7, test:t8, test:t9, test:t10, test:t13, test:t15a,
  test:t17. No `continue-on-error` anywhere.
- `.github/workflows/content.yml` — bypass lane. Triggers ONLY on
  `paths: [src/content/**, src/assets/content/**]` (push to dev + PR into
  main); runs build + test:t2 (schema validation) only. Brand assets
  (`src/assets/brand/**`) are deliberately NOT bypass paths — they take the
  full ci.yml gate.
- `src/assets/content/.gitkeep` — creates the pinned future home of authored
  content images so the bypass path list is real today.
- T14 alert stub — final ci.yml job `notify-failure`, `needs: [gate]`,
  `if: failure()`. Reads `${{ secrets.ALERT_WEBHOOK_URL }}` and
  `${{ vars.ALERT_CHANNEL }}`; when either is unset (now) it echoes
  "alert stub: no channel configured" and exits 0. The destination is a
  Pete-supplied [FILL] — no destination was invented.
- T16 IndexNow stub — committed key file
  `public/ed10e79cc5872cd3c6df034fb35a7560.txt` (random 32-hex key, content
  equals filename; public by protocol design). ci.yml job `notify-indexnow`,
  `needs: [gate]`, `if: github.ref == 'refs/heads/main'` — body is a no-op
  echo stub because hosting is not ratified; the real curl is commented,
  labeled "enable at hosting ratification", and references the SAME key
  filename and the SITE host (`expertmortgagepro.com`,
  `src/config/site.ts`). The build copies the key file into `dist/`
  (asserted by test:t11).
- `tests/run-t10.sh` — hygiene fix: exports `TMPDIR=/tmp`, `TEMP=/tmp`,
  `TMP=/tmp` before `lhci autorun` so a Windows temp env leaking into a WSL
  shell cannot create mis-named temp dirs inside the repo.
- `tests/run-t11.sh` + `test:t11` script — yaml-parses both workflows
  (js-yaml, already in node_modules) and asserts: every `test:*` script in
  package.json (except test:t11 itself) appears as a ci.yml gate step;
  ci.yml triggers are push-dev + PR-main with the bypass paths ignored;
  content.yml triggers only on the bypass paths and runs build + test:t2
  only; `notify-failure` exists with `if: failure()` and the webhook
  secret/var wiring plus stub fallback; `notify-indexnow` is main-gated and
  labeled; the key file exists in `public/` with content == filename,
  appears in the ci.yml curl line together with the SITE host, and ships in
  `dist/` after build.

## Acceptance results
1. `npm run test:t11` exits 0 — all 10 assertions PASS. Full suite list +
   clean build exit 0: build, test:jsonld, test:t2, test:t4, test:t5,
   test:t6, test:t7, test:t8, test:t9, test:t10, test:t13, test:t15a,
   test:t17 — all PASS (t13 was re-run standalone after a concurrent-run
   fixture-dir race with t10 during verification; both pass clean).
2. Committed as `T11+T14+T16: CI pipeline, alert stub, IndexNow stub` with
   this checkpoint and the task file; status clean after. NOT pushed —
   pushing is the reviewer's gate.

## Post-push proof (reviewer's gate, not mine)
`gh run list --branch=dev` shows ci.yml green with all battery steps; a
content-only test commit triggers content.yml alone; branch protection
remains API-verified.
