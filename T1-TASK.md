# T1 — Scaffold Astro clean on dev (supervised task 1 of the EMP build)

You are the build seat for a static Astro website. Work ONLY in this repository,
ONLY on the currently checked-out `dev` branch. Never touch `main`, never push.

## Task
Scaffold a clean, minimal Astro project (latest Astro 5.x, static output, TypeScript
strict) at the repo root. Requirements:
- Clean scaffold, non-interactive; no example/demo content, no default blog template.
- Keep the existing `src/assets/brand/` directory EXACTLY as is (5 files) — do not move,
  rename, or reference them yet.
- Keep the existing README.md and this file.
- `package.json` scripts: dev, build, preview. Pin astro as an exact-version dependency.
- One placeholder route only: src/pages/index.astro containing a single `<h1>EMP</h1>`
  and NOTHING else (no styling, no copy — content comes later under sole-authorship rules).
- .gitignore appropriate for Astro/node.
- NO other routes, collections, components, or content — later tasks add those.

## Acceptance (verify before finishing)
1. `npm install` then `npm run build` exits 0.
2. `dist/index.html` exists and contains `<h1>EMP</h1>`.
3. `git status` clean after you `git add -A && git commit -m "T1: scaffold Astro clean on dev"`.
4. All five files still present in `src/assets/brand/`.

Write a T1-CHECKPOINT.md summarizing what you did and the acceptance results, include it
in the commit. Do not do any work beyond T1.
