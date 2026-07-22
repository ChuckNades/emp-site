# T2 — Content collections + schema enforcement (supervised task 2)

Work ONLY in this repo on the checked-out `dev` branch. Never touch `main`, never push.
Do not modify src/assets/brand/, README.md, T1-*.md, or index.astro beyond what this task requires.

## Build

**1. `src/config/hubs.ts`** — the single source of truth mapping category keys to hub slugs:
`learn → /learn/`, `partners → /grow/`, `originators → /become/`. Export the enum values and the
map as typed constants. No other file may hardcode hub slugs, ever.

**2. `src/data/facts.ts`** — the canonical facts module. Typed constants; empty-string fields are
deliberate `[FILL]` placeholders Pete supplies later (never invent values):
- `legalName: ""` · `nmls: "55223"` · `nmlsConsumerAccessUrl: "https://www.nmlsconsumeraccess.org/"` 
- `huntsvilleAddress: ""` · `birminghamAddress: ""` · `licensureStatement: ""`
- `licensureStates: ["AL", "TN", "MS"] as const` · `podcastHostDomain: ""`

**3. Five Astro content collections** (`src/content.config.ts`, zod schemas, Astro 5 content-layer):
- `posts` (mdx/md): required `title, description, slug, datePublished, author, category`;
  optional `dateModified` (defaults to datePublished), `alsoRelevantTo`, `tags`, `image`, `faq`, `draft` (default false).
  `category`: z.enum(['learn','partners','originators']) — import the enum from hubs.ts.
  `alsoRelevantTo`: optional array of the same enum. `faq`: optional array of `{question, answer}` strings.
  `author`: reference to `people`. Dates: ISO-8601 strings validated as dates. `image`: string path.
- `faqs`: required `question, answer`; optional `tags`, `draft` (default false).
- `shownotes`: required `title, description, slug, datePublished, episodeNumber (number)`;
  optional `dateModified, youtubeId, image, draft`.
- `videos`: required `title, description, slug, datePublished, youtubeId`; optional `image, draft`.
- `people`: data collection (json/yaml); fields `name, jobTitle, nmls, sameAs (string[] of URLs), image`.
  Create the single real entry `pete` with `nmls` imported/matching facts.ts ("55223"); other fields may be
  placeholder-empty; never invent biography.

**4. Fixtures at `tests/fixtures/`** (fixture-copy policy: every fixture entry title is prefixed
`FIXTURE:` and content bodies are one neutral placeholder sentence — no mortgage copy):
- `valid/post-fixture.mdx`, `valid/faq-fixture.md`, `valid/shownotes-fixture.md`, `valid/videos-fixture.md`
- `valid/post-draft-fixture.mdx` — same as post fixture but `draft: true`
- `invalid/missing-datePublished.mdx` · `invalid/bad-category.mdx` · `invalid/bad-alsoRelevantTo.mdx`
- `invalid/faq-missing-answer.md` · `invalid/shownotes-missing-episodeNumber.md` · `invalid/videos-missing-youtubeId.md`
- The valid post fixture must OMIT `alsoRelevantTo` (proves optionality).

**5. Test script `tests/run-t2.sh`** (bash, exits nonzero on any failure), the T2 mechanism:
a. Install all `valid/` fixtures into `src/content/<collection>/`, run `npm run build` — must exit 0.
b. Assert the draft fixture's content appears NOWHERE in `dist/` (grep for its slug and title — 0 hits).
c. For EACH `invalid/` fixture: install it alone (valid set + that one file), run build, assert NONZERO exit, remove it.
d. Clean up: remove installed fixtures from src/content/ afterward so the repo stays fixture-free.
Wire it as `npm run test:t2`.

## Acceptance (verify before finishing)
1. `npm run test:t2` exits 0 and prints a per-check PASS line (valid build, draft exclusion, each of 6 invalid cases).
2. `npm run build` exits 0 on the clean repo (no fixtures installed).
3. `git add -A && git commit -m "T2: content collections + schema enforcement"` — status clean after.
4. Write `T2-CHECKPOINT.md` (what was built, acceptance results) and include it in the commit.

Do not do any work beyond T2.
