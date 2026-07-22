#!/usr/bin/env bash
# T8 test mechanism: image format+size gate.
# Installs the valid fixture set, performs a FRESH build, then walks dist/
# via tests/check-images.mjs. Exits nonzero on any failure.
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

if node tests/check-images.mjs; then
  pass "check-images (four gate clauses over dist/)"
else
  fail "check-images (one or more gate clauses failed)"
fi

echo "All T8 checks passed."
