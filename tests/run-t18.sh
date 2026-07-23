#!/usr/bin/env bash
# T18 test mechanism: surface guardrails on the final dist (last build task).
# Removes any leftover fixture content, performs a FRESH CLEAN production
# build (no fixtures — never checks a stale dist/), then asserts the four
# guardrails in tests/check-t18.mjs: exact route allowlist, capture elements
# only inside [data-tool-island], areaServed == facts.ts licensure states,
# zero subscribe/newsletter surfaces.
# Exits nonzero on any failure.
set -u
cd "$(dirname "$0")/.."

CONTENT_DIR="src/content"
COLLECTIONS="posts faqs shownotes videos"

cleanup() {
  for col in $COLLECTIONS; do
    rm -rf "$CONTENT_DIR/$col"
  done
}
trap cleanup EXIT

pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; exit 1; }

# Clean build: no fixtures installed, and any leftover collection content from
# an interrupted fixture run is removed BEFORE building so dist/ is the true
# production surface.
cleanup
if npm run build >/dev/null 2>&1; then
  pass "clean production build (fresh dist/, no fixtures)"
else
  fail "clean production build (npm run build exited nonzero)"
fi

if node tests/check-t18.mjs; then
  pass "check-t18 (route allowlist, capture elements, areaServed, subscribe/newsletter)"
else
  fail "check-t18 (one or more surface guardrails failed)"
fi

echo "All T18 checks passed."
