#!/usr/bin/env bash
# T12 test mechanism: dictate→MDX intake script.
# Runs scripts/intake-transcript.mjs on the pinned fixture transcript and
# asserts: (a) the emitted MDX exists in src/content/posts/ and passes a
# production build (schema-valid) with draft:true and a `FIXTURE: ` title;
# (b) 100% of the transcript's sentences appear VERBATIM in the emitted body,
# in order (transport, not editing — a canned or rewriting script fails);
# (c) in the production dist/ the emitted page's URL has NO built file
# (direct-path check) and appears in no hub list or sitemap entry; (d) a
# second intake run does not clobber — it emits a suffixed slug; (e) all
# emitted files are removed afterward.
# Exits nonzero on any failure; prints a per-check PASS line.
set -u
cd "$(dirname "$0")/.."

FIXTURE="tests/fixtures/transcript-sample.txt"
POSTS_DIR="src/content/posts"
BASE_SLUG="fixture-sample-dictation-about-organizing-a-weekly-review-ha"
EMITTED_1="$POSTS_DIR/$BASE_SLUG.mdx"
EMITTED_2="$POSTS_DIR/$BASE_SLUG-2.mdx"

pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; exit 1; }

cleanup() {
  rm -f "$EMITTED_1" "$EMITTED_2"
  # Remove the posts dir only when the intake runs created it (nothing else
  # lives there on a clean repo).
  rmdir "$POSTS_DIR" 2>/dev/null || true
}
trap cleanup EXIT

[ -f "$FIXTURE" ] || fail "$FIXTURE missing"
[ -f scripts/intake-transcript.mjs ] || fail "scripts/intake-transcript.mjs missing"
grep -q '"intake": "node scripts/intake-transcript.mjs"' package.json ||
  fail 'package.json missing the "intake" script wiring'
pass 'intake script + fixture present, npm wiring in place'

# --- run intake twice (second run proves dedup, files cleaned at the end) ---
npm run intake -- "$FIXTURE" >/dev/null 2>&1 || fail "first intake run exited nonzero"
[ -f "$EMITTED_1" ] || fail "first intake run did not emit $EMITTED_1"
pass "first intake run emitted $EMITTED_1"

npm run intake -- "$FIXTURE" >/dev/null 2>&1 || fail "second intake run exited nonzero"
if [ -f "$EMITTED_2" ] && [ -f "$EMITTED_1" ]; then
  pass "second intake run emitted suffixed slug ($BASE_SLUG-2) without clobbering"
else
  fail "dedup: expected both $EMITTED_1 and $EMITTED_2 after two runs"
fi

# --- a. frontmatter: draft:true ALWAYS + FIXTURE: title ---------------------
node - "$EMITTED_1" <<'EOF' || fail "frontmatter assertions"
const fs = require('fs');
const file = process.argv[2];
const raw = fs.readFileSync(file, 'utf8');
const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
if (!m) { console.error('FAIL: no frontmatter block'); process.exit(1); }
const fm = m[1];
const val = (key) => (fm.match(new RegExp(`^${key}:\\s*"?([^"\\n]*)"?\\s*$`, 'm')) || [])[1];
if (!val('title') || !val('title').startsWith('FIXTURE: ')) {
  console.error(`FAIL: title missing or not FIXTURE:-prefixed (got "${val('title')}")`);
  process.exit(1);
}
if (val('draft') !== 'true') { console.error('FAIL: draft is not true'); process.exit(1); }
if (!/^\d{4}-\d{2}-\d{2}$/.test(val('datePublished') || '')) {
  console.error(`FAIL: datePublished not an ISO date (got "${val('datePublished')}")`);
  process.exit(1);
}
if (val('author') !== 'pete') { console.error('FAIL: author is not pete'); process.exit(1); }
if (!['learn', 'partners', 'originators'].includes(val('category'))) {
  console.error(`FAIL: category invalid (got "${val('category')}")`);
  process.exit(1);
}
if ((val('description') || '').length > 160) { console.error('FAIL: description > 160 chars'); process.exit(1); }
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(val('slug') || '') || val('slug').length > 60) {
  console.error(`FAIL: slug not pinned-kebab or > 60 chars (got "${val('slug')}")`);
  process.exit(1);
}
console.log('PASS: frontmatter draft:true, FIXTURE: title, ISO date, pete, valid category, ≤160 description, pinned slug');
EOF

# --- b. verbatim transport: every transcript sentence in the body, in order -
# Mirror of the script's own rules: blank lines are the ONLY paragraph
# boundaries; Intl.Segmenter("en", sentence) splits within each paragraph.
node - "$FIXTURE" "$EMITTED_1" <<'EOF' || fail "verbatim transport"
const fs = require('fs');
const [fixture, emitted] = process.argv.slice(2);
const raw = fs.readFileSync(fixture, 'utf8');
const rawLines = raw.split('\n');
const firstLineIdx = rawLines.findIndex((l) => l.trim().length > 0);
const paragraphs = [];
let current = [];
for (const rawLine of rawLines.slice(firstLineIdx + 1)) {
  const trimmed = rawLine.trim();
  if (trimmed.length === 0) {
    if (current.length > 0) { paragraphs.push(current.join(' ')); current = []; }
  } else {
    current.push(trimmed);
  }
}
if (current.length > 0) paragraphs.push(current.join(' '));
const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
const ABBREV = /(?:^|\s)(?:Dr|Mr|Mrs|Ms|St|Jr|Sr|Prof|Gov|Sen|Rep|Gen|Col|Capt|Lt|Sgt|vs|etc|e\.g|i\.e)\.$/;
const sentences = [];
for (const p of paragraphs) {
  const parts = [];
  for (const { segment } of segmenter.segment(p)) {
    if (parts.length > 0 && ABBREV.test(parts[parts.length - 1].trimEnd())) {
      parts[parts.length - 1] += segment;
    } else {
      parts.push(segment);
    }
  }
  sentences.push(...parts.map((s) => s.trim()).filter(Boolean));
}
if (sentences.length < 8 || sentences.length > 16) {
  console.error(`FAIL: fixture sentence count ${sentences.length} outside the pinned 8-16 range`);
  process.exit(1);
}
const emittedBody = fs.readFileSync(emitted, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
let cursor = 0;
for (const s of sentences) {
  const at = emittedBody.indexOf(s, cursor);
  if (at === -1) {
    console.error(`FAIL: sentence missing or out of order in emitted body: "${s.slice(0, 60)}…"`);
    process.exit(1);
  }
  cursor = at + s.length;
}
// The body must be ONLY the sentences (paragraph-joined) — no added copy.
const residual = emittedBody.replace(/[ \t]+/g, ' ').trim();
const stripped = residual.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
if (stripped.length !== sentences.length || !stripped.every((p, i) => p === sentences[i])) {
  console.error('FAIL: emitted body is not exactly the transcript sentences as paragraphs (added or altered copy)');
  process.exit(1);
}
console.log(`PASS: all ${sentences.length} transcript sentences verbatim, in order, as the only body content`);

// R8: tricky sentences survive verbatim WITHIN their paragraphs — the
// segmenter must not split "Dr. Smith", "3.5 percent", or an ellipsis, and
// the blank line in the fixture must be the only paragraph boundary.
const tricky = [
  'The speaker once asked Dr. Smith how the routine should be recorded.',
  'The notes show the review took 3.5 percent of the weekly planning time.',
  'The speaker paused mid-thought… then finished the sentence anyway.',
];
for (const t of tricky) {
  if (!sentences.includes(t)) {
    console.error(`FAIL: segmenter split or altered the tricky sentence: "${t.slice(0, 60)}…"`);
    process.exit(1);
  }
  if (!stripped.some((p) => p === t)) {
    console.error(`FAIL: tricky sentence not transported verbatim as its own paragraph: "${t.slice(0, 60)}…"`);
    process.exit(1);
  }
}
// The fixture's blank line starts a new paragraph group: the first tricky
// sentence must NOT share a paragraph with the sentence before the blank.
const beforeBlank = 'The transcript ends with a simple statement that the habit feels sustainable.';
if (!stripped.some((p) => p === beforeBlank)) {
  console.error('FAIL: sentence before the blank line did not remain its own paragraph (reflow across a blank line)');
  process.exit(1);
}
console.log('PASS: "Dr. Smith", "3.5 percent", and the ellipsis survive verbatim within their paragraphs');
EOF

# --- a2. production build with the emitted drafts present (schema-valid) ----
if npm run build >/dev/null 2>&1; then
  pass "production build with emitted drafts present (schema-valid)"
else
  fail "production build exited nonzero with the emitted drafts present"
fi

# --- c. draft exclusion: no built page, no hub list entry, no sitemap entry -
node - "$BASE_SLUG" "$BASE_SLUG-2" <<'EOF' || fail "draft exclusion in dist/"
const fs = require('fs');
const slugs = process.argv.slice(2);
// Direct-path check: the draft's URL must have NO built file (not listings).
for (const slug of slugs) {
  const page = `dist/learn/${slug}/index.html`;
  if (fs.existsSync(page)) {
    console.error(`FAIL: built file exists for draft page ${page}`);
    process.exit(1);
  }
}
console.log('PASS: no dist/ file at either draft page URL (direct-path check)');

// No hub list may link to the drafts; no sitemap entry may name them.
const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};
const htmlFiles = walk('dist').filter((f) => f.endsWith('.html'));
for (const slug of slugs) {
  const href = `/learn/${slug}/`;
  const offenders = htmlFiles.filter((f) => fs.readFileSync(f, 'utf8').includes(href));
  if (offenders.length > 0) {
    console.error(`FAIL: hub list / page links to draft ${href}: ${offenders.join(', ')}`);
    process.exit(1);
  }
}
console.log('PASS: no hub list or page in dist/ links to either draft');

const sitemapFiles = fs.readdirSync('dist').filter((f) => /^sitemap-.*\.xml$/.test(f));
if (sitemapFiles.length === 0) { console.error('FAIL: no sitemap-*.xml emitted'); process.exit(1); }
for (const slug of slugs) {
  for (const f of sitemapFiles) {
    if (fs.readFileSync(`dist/${f}`, 'utf8').includes(slug)) {
      console.error(`FAIL: sitemap entry names draft slug ${slug} (${f})`);
      process.exit(1);
    }
  }
}
console.log('PASS: no sitemap entry names either draft slug');
EOF

# e. Cleanup happens via trap on exit.
echo "All T12 checks passed."
