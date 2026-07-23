#!/usr/bin/env bash
# T17 test mechanism: market report page gate.
# Installs the valid fixture set (same collection_for mapping as run-t2),
# performs a FRESH build (never checks a stale dist/), then asserts the
# /market/huntsville/ contract (tests/check-t17.mjs) and the T7 link floor
# (tests/check-links.mjs, with /market/huntsville/ removed from its allowlist).
# Exits nonzero on any failure.
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

# a–e2. Market report page contract over the fresh dist/.
if node tests/check-t17.mjs; then
  pass "check-t17 (route, tables, values, HAAR grep, Dataset JSON-LD, narrative, attribution)"
else
  fail "check-t17 (one or more market-page checks failed)"
fi

# f. The T7 link floor still passes with /market/huntsville/ now REMOVED from
#    the allowlist (the route exists, so the allowlist entry was deleted).
if node tests/check-links.mjs; then
  pass "T7 link floor (check-links.mjs over dist/)"
else
  fail "T7 link floor (check-links.mjs failed)"
fi

echo "All T17 checks passed."
