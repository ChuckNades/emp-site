# T4 — robots.txt + sitemap + llms.txt (supervised task 4)

Work ONLY in this repo on the checked-out `dev` branch. Never touch `main`, never push.
Do not modify src/assets/brand/, existing tests, or earlier T*-TASK/CHECKPOINT files.
Add `.codex-tmp/` to .gitignore while you're here (runtime dir of another tool).

## Build

**1. robots.txt** (static `public/robots.txt`):
- Contains **ZERO `Disallow` directives for any user agent** — this exact form is a ratified
  ruling. `User-agent: *` with `Allow: /`, plus a `Sitemap:` line pointing at
  `https://expertmortgagepro.com/sitemap-index.xml`. Nothing else.

**2. Sitemap** via `@astrojs/sitemap` (pin exact version compatible with astro 5.18.2):
- Wire the `serialize` hook so every URL entry carries `<lastmod>`:
  - Collection-driven pages (when they exist in the build): from the entry's `dateModified`
    (falling back to `datePublished`).
  - Static/core pages: from a per-page date constant — add `src/config/page-dates.ts` mapping
    route → ISO date, with exactly these four entries: `/`, `/about/`, `/results/`, `/contact/`
    (use today's date for all four; they'll diverge naturally). The serialize hook reads this map.
- A single build-time stamp applied to all pages is a FAILURE mode — lastmod must be per-page.

**3. llms.txt** (static `public/llms.txt`):
- Markdown format: an H1 `# Expert Mortgage Pro`, one neutral sentence ("Authority resource for
  mortgage consumers, referral partners, and originators."), and a list of the three pillar hub
  URLs: `https://expertmortgagepro.com/learn/`, `/grow/`, `/become/` (full URLs). Nothing else —
  no invented descriptions of content that doesn't exist yet.

**4. Test script** `tests/run-t4.sh` wired as `npm run test:t4` (nonzero exit on any failure):
a. Build with the valid fixture set installed (the install/cleanup mechanism is in
   `tests/run-t2.sh` — read and reuse it). Add `valid/post-fixture-2.mdx` whose `dateModified`
   differs from `post-fixture.mdx`'s.
b. Assert `dist/robots.txt` exists and contains zero lines starting with `Disallow` (case-insensitive).
c. Assert `dist/llms.txt` exists and lists exactly the three hub URLs.
d. Assert the union of `<url>` entries across emitted sitemap file(s) covers every `dist/**/index.html`
   page exactly once — where "draft-excluded" means content from `valid/post-draft-fixture.mdx`
   (draft: true) must appear in NO sitemap entry — and every entry has `<lastmod>`.
e. **Per-page lastmod proof (not just ≥2 distinct):** each of the four core routes' `<lastmod>`
   equals its `page-dates.ts` entry, and each installed post fixture's `<lastmod>` equals its own
   `dateModified` — assert value-for-value, so a single global stamp cannot pass.
f. Print per-check PASS lines; clean up fixtures after.

## Acceptance (verify before finishing)
1. `npm run test:t4` exits 0, all PASS lines printed.
2. `npm run build` (clean repo) exits 0; `npm run test:jsonld` and `npm run test:t2` still exit 0.
3. Commit `T4: robots + sitemap lastmod + llms.txt` including T4-CHECKPOINT.md; status clean after
   (`.codex-tmp/` ignored, not committed).

Do not do any work beyond T4. Notes: hub pages (/learn/ etc.) do not exist yet (T6) — llms.txt
lists their ratified URLs anyway; the sitemap covers only pages that exist in the build.
