#!/usr/bin/env bash
# T10 test mechanism: Lighthouse CI gates.
# Installs the valid fixture set (same collection_for mapping as run-t2),
# builds, serves dist/ via `astro preview` on a fixed port, runs
# `lhci autorun` (collect: median of LHCI_RUNS runs per URL — default 3,
# echoed at start — on the mobile preset; assert: category-score thresholds
# from lighthouserc.cjs), then cleans up fixtures and the server. On an lhci
# failure it prints one line per failed assertion (url · category · actual ·
# expected) from .lighthouseci/assertion-results.json before exiting nonzero.
set -u
cd "$(dirname "$0")/.."

FIXTURES_DIR="tests/fixtures"
CONTENT_DIR="src/content"
COLLECTIONS="posts faqs shownotes videos"
PORT=44310
BASE_URL="http://localhost:$PORT"

# Chromium's runtime shared libraries (libnspr4/libnss3/libasound) are not
# installed system-wide on this machine and there is no sudo access, so the
# .deb payloads are extracted locally under .codex-tmp/pw-libs/ and exposed
# to the browser via LD_LIBRARY_PATH (same mechanism as run-t9).
PW_LIBS_DIR=".codex-tmp/pw-libs/root/usr/lib/x86_64-linux-gnu"
if [ -d "$PW_LIBS_DIR" ]; then
  export LD_LIBRARY_PATH="$PWD/$PW_LIBS_DIR${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi

# Reuse the Playwright Chromium for Lighthouse (lhci honors CHROME_PATH).
# R6: LHCI's chromeFlags plumbing is not reliably delivering --no-sandbox to
# the runner's ChromeLauncher ("No usable sandbox" FATAL despite the flags in
# lighthouserc.cjs). Stop relying on it: generate a wrapper script that
# hard-codes the sandbox flags and export CHROME_PATH pointing at the WRAPPER.
# The lighthouserc chromeFlags stay too (belt and suspenders).
CHROME_BIN="$HOME/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome"
if [ -x "$CHROME_BIN" ]; then
  CHROME_WRAPPER=".codex-tmp/chrome-wrapped.sh"
  mkdir -p .codex-tmp
  cat > "$CHROME_WRAPPER" <<EOF
#!/usr/bin/env bash
exec "$CHROME_BIN" --no-sandbox --disable-dev-shm-usage "\$@"
EOF
  chmod +x "$CHROME_WRAPPER"
  export CHROME_PATH="$PWD/$CHROME_WRAPPER"
  # Proof in logs: the wrapper path and its first two lines.
  echo "T10: CHROME_PATH=$CHROME_PATH (chrome wrapper)"
  head -2 "$CHROME_WRAPPER"
fi

# chrome-launcher detects WSL and assumes a WINDOWS Chrome: it would build a
# Windows temp path (C:\Users\...\lighthouse.NNN) that the Linux browser then
# creates literally inside the repo. We run the LINUX Playwright Chromium, so
# lighthouserc.cjs pins an explicit Linux user-data-dir via chromeFlags —
# makeTmpDir() is skipped entirely when userDataDir is set. The profile dir
# lives under .codex-tmp/ (gitignored) and is removed by the trap below.
CHROME_PROFILE_DIR=".codex-tmp/lhci-chrome-profile"
mkdir -p "$CHROME_PROFILE_DIR"
export LHCI_CHROME_USER_DATA_DIR="$PWD/$CHROME_PROFILE_DIR"

# Hygiene: pin the temp dir to /tmp so a Windows TEMP/TMP leaking into a WSL
# shell cannot make lhci/chrome-launcher create mis-named temp dirs inside
# the repo.
export TMPDIR=/tmp
export TEMP=/tmp
export TMP=/tmp

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
  rm -rf "$CHROME_PROFILE_DIR"
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

# R4: echo the effective Lighthouse sample count (lighthouserc.cjs reads
# LHCI_RUNS, default 3; ci.yml sets LHCI_RUNS=5) so the log proves which
# sample the run used.
RUNS="${LHCI_RUNS:-3}"
echo "T10: Lighthouse sample count — numberOfRuns=$RUNS (LHCI_RUNS=${LHCI_RUNS:-<unset, default 3>})"

if LHCI_BASE_URL="$BASE_URL" npx lhci autorun; then
  echo "All T10 Lighthouse gates passed."
else
  # R4: surface the failure detail — one line per failed assertion
  # (url · category · actual · expected) from the lhci assertion results —
  # before exiting nonzero. No more blind FAIL lines.
  RESULTS=".lighthouseci/assertion-results.json"
  if [ -f "$RESULTS" ]; then
    echo "Failed Lighthouse assertions (url · category · actual · expected):"
    node -e '
      const results = JSON.parse(require("fs").readFileSync(".lighthouseci/assertion-results.json", "utf8"));
      for (const r of results) {
        if (r.passed) continue;
        const category = r.auditId || r.name || "?";
        const actual = r.actual !== undefined ? JSON.stringify(r.actual) : "?";
        const expected = r.expected !== undefined ? JSON.stringify(r.expected) : (r.operator || "?");
        console.log(`  ${r.url} · ${category} · actual ${actual} · expected ${expected}`);
      }
    ' || echo "  (could not parse $RESULTS)"
    fail "lhci autorun (one or more URLs below threshold on median-of-$RUNS)"
  else
    # R5: no assertion-results.json means lhci never reached the assert phase
    # (e.g. Chrome failed to launch) — say so without the misleading
    # "below threshold" wording.
    fail "lhci failed before assert — no assertion results at $RESULTS (see output above)"
  fi
fi
