#!/usr/bin/env bash
# T15b test mechanism: identity-system contrast gate.
# Installs the valid fixture set (same collection_for mapping as run-t2),
# performs a FRESH build (never checks a stale dist/), then asserts the
# declared WCAG contrast pairs and the coral/gold accent-text ban over the
# built CSS via tests/check-contrast.mjs. Exits nonzero on any failure.
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

if node tests/check-contrast.mjs; then
  pass "check-contrast (declared pairs + coral/gold accent-text ban over dist/)"
else
  fail "check-contrast (one or more contrast assertions failed)"
fi

echo "All T15b checks passed."
