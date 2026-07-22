# T6 — Pillar hubs + cluster article templates + FAQ hub (supervised task 6)

Work ONLY in this repo on the checked-out `dev` branch. Never touch `main`, never push.
Do not modify src/assets/brand/ or earlier T*-TASK/CHECKPOINT files. Existing tests may be
extended, never weakened. Copy policy as before: NO editorial copy — structure, neutral labels,
collection-driven content only.

## Build

**1. Three pillar hub pages** driven by `src/config/hubs.ts` (the ONLY place slugs exist):
- Generate the routes `/learn/`, `/grow/`, `/become/` dynamically from the hubs map (e.g. one
  `src/pages/[hub]/index.astro` using `getStaticPaths` over the map — zero hardcoded slug strings
  in any template; import from hubs.ts).
- Each hub page: H1 = a neutral hub label defined IN hubs.ts (add a `label` field: learn→"Learn",
  partners→"Grow", originators→"Become"), and a list of its cluster articles pulled from the
  `posts` collection — a post belongs on a hub when its `category` OR its `alsoRelevantTo`
  includes that hub's key. Exclude `draft: true` in production builds.

**2. Cluster article route** `/[hub]/[slug]/` for posts:
- The OWNING hub (from `category`) is the canonical URL: `/{ownerHubSlug}/{post.slug}/`.
- A post with `alsoRelevantTo` appears in the OTHER hub's list but links to the SAME canonical
  URL — never a second route for the same post.
- Article template: renders title/body via Base layout; emits `Article` JSON-LD (headline,
  datePublished, dateModified fallback, author → the `people` pete entry) + `BreadcrumbList`
  (home → owning hub → article). Canonical tag = the owning-hub URL.
- If the post has embedded `faq` pairs, ALSO emit `FAQPage` JSON-LD from them.

**3. FAQ hub** `/faq/`:
- Lists all non-draft `faqs` collection entries (question + answer rendered on the page —
  visible content, not just markup) and emits ONE `FAQPage` JSON-LD with all Q/A as mainEntity.

**4. Extend `tests/validate-jsonld.mjs`** (add, never remove): on cluster pages —
Article→headline,author,datePublished,dateModified (fallback applied = present) required,
BreadcrumbList present, and the canonical link equals the owning-hub URL for that page; on /faq/ —
FAQPage→mainEntity nonempty AND mainEntity count equals the number of visibly rendered questions.

**5. Test script** `tests/run-t6.sh` wired as `npm run test:t6` (PASS lines, nonzero on failure):
a. Zero hardcoded hub-slug literals ("/learn/", "/grow/", "/become/") anywhere in `src/**`
   EXCEPT `src/config/hubs.ts` itself — everything resolves through hubs.ts. (public/llms.txt is
   static and exempt.)
b. With valid fixtures installed: the `category: learn` fixture appears on the learn hub page.
c. Install a fixture post with `category: partners` AND `alsoRelevantTo: ["originators"]`
   (add `tests/fixtures/valid/post-crosslane-fixture.mdx` — frontmatter per the §5 schema: title
   "FIXTURE: crosslane", description/slug neutral, distinct ISO dates, author `pete`, body one
   neutral placeholder sentence): it appears in BOTH the grow and become hub lists; exactly ONE
   article route exists for it (under the grow slug); its canonical tag on that page equals the
   grow URL; zero duplicate routes for its slug under any other hub.
d. The draft fixture appears on NO hub list and has NO article route (production build).
e. `/faq/` renders the faq fixture's question AND answer text visibly; the count of rendered
   questions equals the count of installed non-draft faq fixtures; FAQPage JSON-LD present with
   matching mainEntity count.
f. `npm run test:jsonld` passes over the fixture-installed build (Article + FAQPage assertions).
g. Cleanup after.

## Acceptance
1. `npm run test:t6` exits 0; clean-repo `npm run build`, `test:jsonld`, `test:t2`, `test:t4`,
   `test:t5` all still exit 0.
2. Commit `T6: pillar hubs + cluster templates + FAQ hub` with T6-CHECKPOINT.md; status clean.

Do not do any work beyond T6.
