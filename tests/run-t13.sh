#!/usr/bin/env bash
# T13 test mechanism: tool island shell + contract.
# Same install-build-preview-test-cleanup pattern as run-t9: installs the
# valid fixture set (same collection_for mapping as run-t2), builds, serves
# dist/ via `astro preview` on a fixed port, runs playwright (tests/
# island.spec.ts via playwright.t13.config.ts) against it, then cleans up
# fixtures and the server. Exits nonzero on any failure.
set -u
cd "$(dirname "$0")/.."

FIXTURES_DIR="tests/fixtures"
CONTENT_DIR="src/content"
COLLECTIONS="posts faqs shownotes videos"
PORT=44322
BASE_URL="http://localhost:$PORT"

# Chromium's runtime shared libraries (libnspr4/libnss3/libasound) are not
# installed system-wide on this machine and there is no sudo access, so the
# .deb payloads are extracted locally under .codex-tmp/pw-libs/ and exposed
# to the browser via LD_LIBRARY_PATH.
PW_LIBS_DIR=".codex-tmp/pw-libs/root/usr/lib/x86_64-linux-gnu"
if [ -d "$PW_LIBS_DIR" ]; then
  export LD_LIBRARY_PATH="$PWD/$PW_LIBS_DIR${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi

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

PREVIEW_PID=""
cleanup() {
  if [ -n "$PREVIEW_PID" ]; then
    kill "$PREVIEW_PID" 2>/dev/null || true
    wait "$PREVIEW_PID" 2>/dev/null || true
  fi
  for col in $COLLECTIONS; do
    rm -rf "$CONTENT_DIR/$col"
  done
}
trap cleanup EXIT

fail() { echo "FAIL: $1"; exit 1; }

install_valid_set
if npm run build >/dev/null 2>&1; then
  echo "PASS: fixture build (fresh dist/)"
else
  fail "fixture build (npm run build exited nonzero with valid fixtures installed)"
fi

npx astro preview --port "$PORT" >/dev/null 2>&1 &
PREVIEW_PID=$!

# Wait for the preview server to accept connections.
ready=0
for _ in $(seq 1 50); do
  if curl -sf "$BASE_URL/" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 0.2
done
if [ "$ready" -ne 1 ]; then
  fail "astro preview did not start on $BASE_URL"
fi

if T13_BASE_URL="$BASE_URL" npx playwright test --config playwright.t13.config.ts; then
  echo "All T13 checks passed."
else
  fail "playwright island checks"
fi
