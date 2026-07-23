#!/usr/bin/env bash
# T2 test mechanism: content collections + schema enforcement.
# Exits nonzero on any failure; prints a per-check PASS line.
set -u
cd "$(dirname "$0")/.."

FIXTURES_DIR="tests/fixtures"
CONTENT_DIR="src/content"
COLLECTIONS="posts faqs shownotes videos"

# Map a fixture filename to its collection directory.
collection_for() {
  case "$1" in
    faq-*) echo "faqs" ;;
    shownotes-*) echo "shownotes" ;;
    videos-*) echo "videos" ;;
    *) echo "posts" ;;
  esac
}

install_fixture() {
  local file="$1" col
  col="$(collection_for "$(basename "$file")")"
  mkdir -p "$CONTENT_DIR/$col"
  cp "$file" "$CONTENT_DIR/$col/"
}

install_valid_set() {
  for f in "$FIXTURES_DIR"/valid/*; do
    install_fixture "$f"
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

# a. Valid fixtures installed -> build must exit 0.
install_valid_set
if npm run build >/dev/null 2>&1; then
  pass "valid build"
else
  fail "valid build (npm run build exited nonzero with valid fixtures installed)"
fi

# b. Draft fixture content must appear nowhere in dist/.
hits="$(grep -r -l -e 'post-draft-fixture' -e 'FIXTURE: Draft Post' dist/ 2>/dev/null | wc -l)"
if [ "$hits" -eq 0 ]; then
  pass "draft exclusion"
else
  fail "draft exclusion (draft fixture content found in dist/)"
fi

# b2. R1 regression: the breakout fixture's title carries
#     `</script><script>alert(1)`. Its built page's JSON-LD payload must
#     contain NO literal `</script>` (the `<` is escaped as <),
#     and the escaped JSON must still parse.
node - <<'EOF' || fail "JSON-LD breakout escaping"
const fs = require('fs');
const html = fs.readFileSync('dist/learn/jsonld-breakout/index.html', 'utf8');
const blocks = [
  ...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
];
if (blocks.length === 0) {
  console.error('FAIL: no JSON-LD blocks on breakout fixture page');
  process.exit(1);
}
for (const block of blocks) {
  const payload = block[1];
  if (payload.includes('</script>')) {
    console.error('FAIL: JSON-LD payload contains a literal </script> (breakout not escaped)');
    process.exit(1);
  }
  if (!payload.includes('\\u003c/script>')) {
    console.error('FAIL: JSON-LD payload missing the escaped <\\/script> form');
    process.exit(1);
  }
  JSON.parse(payload); // throws if the escaped form is not valid JSON
}
console.log('PASS: JSON-LD breakout escaping (no literal </script>, escaped JSON parses)');
EOF

# c. Each invalid fixture alone (with the valid set) must make the build fail.
for f in "$FIXTURES_DIR"/invalid/*; do
  name="$(basename "$f")"
  install_fixture "$f"
  if npm run build >/dev/null 2>&1; then
    fail "invalid case $name (build unexpectedly succeeded)"
  else
    pass "invalid case $name"
  fi
  rm -f "$CONTENT_DIR/$(collection_for "$name")/$name"
done

# d. Cleanup happens via trap on exit.
echo "All T2 checks passed."
