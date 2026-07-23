#!/usr/bin/env bash
# T15a test mechanism: brand asset integration gate.
# Installs the valid fixture set (same collection_for mapping as run-t2),
# performs a FRESH build (never checks a stale dist/), then asserts the
# superseded-asset quarantine grep, the OG default image, the favicon set,
# and the header/footer mark over dist/. Exits nonzero on any failure.
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

install_valid_set
if npm run build >/dev/null 2>&1; then
  pass "fixture build (fresh dist/)"
else
  fail "fixture build (npm run build exited nonzero with valid fixtures installed)"
fi

# a. Quarantine grep: zero references anywhere in the repo (excluding
#    node_modules, .codex-tmp, dist, .git) to the quarantine dir or the
#    superseded raster logo. This script and the task file name the banned
#    strings as match literals and are the two allowed mentions.
QUAR_HITS="$(grep -r -l -e '_quarantine/' -e 'emp-squircle-gold-sun\.png' . \
  --exclude-dir=node_modules --exclude-dir=.codex-tmp --exclude-dir=dist --exclude-dir=.git \
  | grep -v -e '^\./T15a-TASK\.md$' -e '^\./tests/run-t15a\.sh$' || true)"
if [ -z "$QUAR_HITS" ]; then
  pass "quarantine grep (zero superseded-asset references outside the task/test files)"
else
  fail "quarantine grep (superseded-asset references found: $QUAR_HITS)"
fi

# b. Every built page's og:image is the ABSOLUTE default URL, and
#    dist/og-default.png exists.
OG_ABS='https://expertmortgagepro.com/og-default.png'
og_bad=0
og_count=0
for f in $(find dist -name '*.html' | sort); do
  og_count=$((og_count + 1))
  if ! grep -q "<meta property=\"og:image\" content=\"$OG_ABS\"" "$f"; then
    echo "  og:image missing/incorrect in $f"
    og_bad=$((og_bad + 1))
  fi
done
[ "$og_count" -gt 0 ] || fail "og:image gate (no HTML pages found in dist/)"
[ -f dist/og-default.png ] || fail "og:image gate (dist/og-default.png missing)"
if [ "$og_bad" -eq 0 ]; then
  pass "og:image (all $og_count pages -> $OG_ABS; dist/og-default.png exists)"
else
  fail "og:image gate ($og_bad of $og_count pages incorrect)"
fi

# c. Exactly these files exist in dist/: favicon.svg, favicon-32.png,
#    apple-touch-icon.png, og-default.png; the first three <= 100 KB,
#    og-default.png <= 300 KB. The Base head emits the matching <link> tags.
for name in favicon.svg favicon-32.png apple-touch-icon.png og-default.png; do
  [ -f "dist/$name" ] || fail "favicon/OG files (dist/$name missing)"
done
for name in favicon.svg favicon-32.png apple-touch-icon.png; do
  size=$(stat -c %s "dist/$name")
  [ "$size" -le 102400 ] || fail "favicon/OG files (dist/$name is $size bytes > 100 KB)"
done
size=$(stat -c %s dist/og-default.png)
[ "$size" -le 307200 ] || fail "favicon/OG files (dist/og-default.png is $size bytes > 300 KB)"
head_bad=0
for f in $(find dist -name '*.html' | sort); do
  grep -q '<link rel="icon" href="/favicon.svg"' "$f" || { echo "  favicon.svg <link> missing in $f"; head_bad=$((head_bad + 1)); }
  grep -q '<link rel="icon" href="/favicon-32.png"' "$f" || { echo "  favicon-32.png <link> missing in $f"; head_bad=$((head_bad + 1)); }
  grep -q '<link rel="apple-touch-icon" href="/apple-touch-icon.png"' "$f" || { echo "  apple-touch-icon <link> missing in $f"; head_bad=$((head_bad + 1)); }
done
if [ "$head_bad" -eq 0 ]; then
  pass "favicon/OG files (4 files present, sizes in cap; <link rel> tags on every page)"
else
  fail "favicon/OG files ($head_bad <link> assertion(s) failed)"
fi

# e. Header contains an anchor to / wrapping the mark (emp-mark in its src),
#    and the footer contains the mark reference too — on every built page.
mark_bad=0
for f in $(find dist -name '*.html' | sort); do
  header="$(sed -n 's/.*<header>\(.*\)<\/header>.*/\1/p' "$f")"
  [ -n "$header" ] || { echo "  no single-line <header> in $f"; mark_bad=$((mark_bad + 1)); continue; }
  echo "$header" | grep -q '<a href="/"><img src="[^"]*emp-mark[^"]*"' \
    || { echo "  header mark anchor missing in $f"; mark_bad=$((mark_bad + 1)); }
  footer="$(sed -n 's/.*<footer>\(.*\)<\/footer>.*/\1/p' "$f")"
  echo "$footer" | grep -q '<img src="[^"]*emp-mark[^"]*"' \
    || { echo "  footer mark missing in $f"; mark_bad=$((mark_bad + 1)); }
done
if [ "$mark_bad" -eq 0 ]; then
  pass "header/footer mark (anchor-to-/ wrapping emp-mark in header; mark in footer; every page)"
else
  fail "header/footer mark ($mark_bad assertion(s) failed)"
fi

# d. The T8 image gate still passes over the same fresh dist/ (the favicon/OG
#    PNGs are pipeline-exempt public/ assets via the pinned allowlist in
#    tests/check-images.mjs).
if node tests/check-images.mjs; then
  pass "T8 image gate (check-images.mjs over dist/)"
else
  fail "T8 image gate (check-images.mjs failed)"
fi

echo "All T15a checks passed."
