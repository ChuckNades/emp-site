# T1 Checkpoint — Scaffold Astro clean on dev

## What was done
- Scaffolded a minimal Astro project at the repo root on the `dev` branch (no interactive
  scaffolder, no example/demo content, no blog template).
- `package.json`: scripts `dev`, `build`, `preview`; `astro` pinned as an exact-version
  dependency (`5.18.2`, latest 5.x at time of scaffold); `typescript` as devDependency.
- `astro.config.mjs`: `defineConfig({ output: 'static' })`.
- `tsconfig.json`: extends `astro/tsconfigs/strict` (TypeScript strict).
- One placeholder route only: `src/pages/index.astro` containing a single `<h1>EMP</h1>`
  and nothing else. No other routes, collections, components, or content.
- `.gitignore` for Astro/node (`dist/`, `.astro/`, `node_modules/`, logs, `.env`, etc.).
- Existing files untouched: `README.md`, `T1-TASK.md`, and all 5 files in
  `src/assets/brand/` (not moved, renamed, or referenced).

## Acceptance results
1. `npm install` then `npm run build` exits 0 — PASS (1 page built, static output).
2. `dist/index.html` exists and contains `<h1>EMP</h1>` — PASS
   (`<!DOCTYPE html><h1>EMP</h1>`).
3. `git status` clean after `git add -A && git commit -m "T1: scaffold Astro clean on dev"` — PASS.
4. All five files still present in `src/assets/brand/` — PASS
   (`emp-mark-reversed.svg`, `emp-mark-small.svg`, `emp-mark.svg`,
   `emp-portrait-bare-1000.png`, `emp-portrait-graded-1000.png`).
