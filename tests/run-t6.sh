#!/usr/bin/env bash
# T6 test mechanism: pillar hubs + cluster article templates + FAQ hub.
# Exits nonzero on any failure; prints a per-check PASS line.
set -u
cd "$(dirname "$0")/.."

FIXTURES_DIR="tests/fixtures"
CONTENT_DIR="src/content"
COLLECTIONS="posts faqs shownotes videos"

# Map a fixture filename to its collection directory (same rules as run-t2.sh).
collection_for() {
  case "$1" in
    faq-*) echo "faqs" ;;
    shownotes-*) echo "shownotes" ;;
    videos-*) echo "videos" ;;
    *) echo "posts" ;;
  esac
}

install_valid_set() {
  for f in "$FIXTURES_DIR"/valid/*; do
    local col
    col="$(collection_for "$(basename "$f")")"
    mkdir -p "$CONTENT_DIR/$col"
    cp "$f" "$CONTENT_DIR/$col/"
  done
}

cleanup() {
  for col in $COLLECTIONS; do
    rm -rf "$CONTENT_DIR/$col"
  done
}
trap cleanup EXIT

pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; exit 1; }

# a. Zero hardcoded hub-slug literals anywhere in src/** EXCEPT
#    src/config/hubs.ts itself — everything resolves through hubs.ts.
#    (public/llms.txt is static and exempt; it is not under src/.)
hits="$(grep -rn -e '"/learn/"' -e '"/grow/"' -e '"/become/"' \
          -e "'/learn/'" -e "'/grow/'" -e "'/become/'" \
          src/ --exclude-dir=assets | grep -v '^src/config/hubs\.ts:' | wc -l)"
[ "$hits" -eq 0 ] || fail "hardcoded hub slugs ($hits literal(s) in src/** outside src/config/hubs.ts)"
pass "zero hardcoded hub-slug literals in src/** (hubs.ts is the only source)"

# Install the valid fixture set and build once for checks b–f.
install_valid_set
if npm run build >/dev/null 2>&1; then
  pass "fixture build"
else
  fail "fixture build (npm run build exited nonzero with valid fixtures installed)"
fi

# b. The category: learn fixture appears on the learn hub page.
grep -q 'FIXTURE: Valid Post' dist/learn/index.html \
  || fail "learn hub (category: learn fixture not listed on /learn/)"
grep -q 'href="/learn/post-fixture/"' dist/learn/index.html \
  || fail "learn hub (link to /learn/post-fixture/ missing)"
pass "learn hub lists the category: learn fixture"

# c. Crosslane fixture (category: partners + alsoRelevantTo: [originators]):
#    listed on BOTH grow and become hubs; exactly ONE article route, under the
#    grow slug; canonical equals the grow URL; zero duplicate routes.
grep -q 'FIXTURE: crosslane' dist/grow/index.html \
  || fail "crosslane (not listed on /grow/)"
grep -q 'FIXTURE: crosslane' dist/become/index.html \
  || fail "crosslane (not listed on /become/)"
pass "crosslane fixture listed on both /grow/ and /become/"

[ -f dist/grow/post-crosslane-fixture/index.html ] \
  || fail "crosslane (article route dist/grow/post-crosslane-fixture/ missing)"
routes="$(find dist -type d -name 'post-crosslane-fixture' | wc -l)"
[ "$routes" -eq 1 ] || fail "crosslane (expected exactly 1 article route, found $routes)"
pass "exactly one crosslane article route, under /grow/"

canonical="$(grep -o '<link[^>]*rel="canonical"[^>]*>' dist/grow/post-crosslane-fixture/index.html)"
echo "$canonical" | grep -q 'href="https://expertmortgagepro.com/grow/post-crosslane-fixture/"' \
  || fail "crosslane (canonical is not the grow URL: $canonical)"
pass "crosslane canonical equals the grow URL"

# Become hub must link to the SAME canonical grow URL — never a second route.
grep -q 'href="/grow/post-crosslane-fixture/"' dist/become/index.html \
  || fail "crosslane (/become/ list does not link to the canonical grow URL)"
pass "become hub links crosslane to the canonical grow URL"

# d. The draft fixture appears on NO hub list and has NO article route.
for hub in learn grow become; do
  if grep -q 'post-draft-fixture' "dist/$hub/index.html"; then
    fail "draft exclusion (draft fixture listed on /$hub/)"
  fi
done
if find dist -type d -name 'post-draft-fixture' | grep -q .; then
  fail "draft exclusion (draft fixture has an article route)"
fi
pass "draft fixture on no hub list, no article route"

# e. /faq/ renders the faq fixture's question AND answer visibly; rendered
#    question count equals installed non-draft faq fixture count; FAQPage
#    JSON-LD mainEntity count matches.
grep -q 'FIXTURE: What is a fixture question?' dist/faq/index.html \
  || fail "/faq/ (fixture question not rendered)"
grep -q 'A fixture answer.' dist/faq/index.html \
  || fail "/faq/ (fixture answer not rendered)"
pass "/faq/ renders the faq fixture's question and answer"

faq_expected=0
for f in "$FIXTURES_DIR"/valid/faq-*; do
  grep -q '^draft:[[:space:]]*true' "$f" || faq_expected=$((faq_expected + 1))
done
node - "$faq_expected" <<'EOF' || exit 1
const fs = require('fs');
const expected = Number(process.argv[2]);
const html = fs.readFileSync('dist/faq/index.html', 'utf8');
const fail = (msg) => { console.error(`FAIL: /faq/ (${msg})`); process.exit(1); };

const main = html.match(/<main>[\s\S]*?<\/main>/i)?.[0] ?? '';
const rendered = (main.match(/<h2[\s>]/gi) ?? []).length;
if (rendered !== expected) {
  fail(`rendered question count ${rendered} != installed non-draft faq fixtures ${expected}`);
}

const blocks = [
  ...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
];
const nodes = [];
for (const block of blocks) {
  const flatten = (node) => {
    if (Array.isArray(node)) node.forEach(flatten);
    else if (node && typeof node === 'object') {
      if (Array.isArray(node['@graph'])) node['@graph'].forEach(flatten);
      else nodes.push(node);
    }
  };
  flatten(JSON.parse(block[1]));
}
const faqPages = nodes.filter((n) =>
  (Array.isArray(n['@type']) ? n['@type'] : [n['@type']]).includes('FAQPage'),
);
if (faqPages.length !== 1) fail(`expected exactly 1 FAQPage JSON-LD, found ${faqPages.length}`);
const entities = faqPages[0].mainEntity?.length ?? 0;
if (entities !== rendered) {
  fail(`FAQPage mainEntity count ${entities} != rendered question count ${rendered}`);
}
console.log(`PASS: /faq/ rendered questions = FAQPage mainEntity = ${expected}`);
EOF

# f. JSON-LD validator over the fixture-installed build (Article + FAQPage).
if npm run test:jsonld >/dev/null 2>&1; then
  pass "test:jsonld (fixture build, Article + FAQPage assertions)"
else
  fail "test:jsonld (exited nonzero on the fixture-installed build)"
fi

# g. Cleanup happens via trap on exit.
echo "All T6 checks passed."
