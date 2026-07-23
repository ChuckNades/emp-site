#!/usr/bin/env bash
# T11 test mechanism: CI workflow wiring.
# Yaml-parses .github/workflows/ci.yml and content.yml (js-yaml from
# node_modules) and asserts: every test:* script in package.json (except
# test:t11 itself) appears as a named ci.yml step; content.yml triggers only
# on the ratified bypass paths; notify-failure exists with if: failure();
# notify-indexnow is main-gated; the IndexNow key file exists in public/ and
# (after a build) in dist/, and its filename appears in the ci.yml curl line.
# Exits nonzero on any failure; prints a per-check PASS line.
set -u
cd "$(dirname "$0")/.."

pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; exit 1; }

CI=".github/workflows/ci.yml"
CONTENT=".github/workflows/content.yml"

[ -f "$CI" ] || fail "$CI missing"
[ -f "$CONTENT" ] || fail "$CONTENT missing"

node - <<'EOF' || exit 1
const fs = require('fs');
const yaml = require('js-yaml');

let failed = false;
const pass = (m) => console.log(`PASS: ${m}`);
const fail = (m) => { console.error(`FAIL: ${m}`); failed = true; };

const ciText = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
const contentText = fs.readFileSync('.github/workflows/content.yml', 'utf8');

let ci, content;
try {
  ci = yaml.load(ciText);
  content = yaml.load(contentText);
  pass('both workflows yaml-parse');
} catch (e) {
  fail(`yaml parse: ${e.message}`);
  process.exit(1);
}

// js-yaml parses the bare `on:` key as boolean true (YAML 1.1).
const onKey = (doc) => (doc.on !== undefined ? 'on' : (doc[true] !== undefined ? true : null));
const ciOn = ci[onKey(ci)];
const contentOn = content[onKey(content)];
if (!ciOn) fail('ci.yml has no trigger block');
if (!contentOn) fail('content.yml has no trigger block');

// 1. Every test:* script in package.json (except test:t11) appears as a
//    named ci.yml step.
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const expected = Object.keys(pkg.scripts)
  .filter((s) => /^test:/.test(s) && s !== 'test:t11')
  .sort();
const stepRuns = (ci.jobs?.gate?.steps || []).map((s) => s.run || '');
const missing = expected.filter((s) => !stepRuns.some((r) => r.includes(`npm run ${s}`)));
if (missing.length === 0) {
  pass(`all ${expected.length} test:* scripts are ci.yml gate steps`);
} else {
  fail(`ci.yml gate missing steps for: ${missing.join(', ')}`);
}

// 2. ci.yml triggers on push to dev and PRs into main, with the bypass
//    paths ignored on both.
const ciPush = ciOn?.push || {};
const ciPr = ciOn?.pull_request || {};
const bypass = ['src/content/**', 'src/assets/content/**'];
const ciBranchesOk =
  JSON.stringify(ciPush.branches) === JSON.stringify(['dev']) &&
  JSON.stringify(ciPr.branches) === JSON.stringify(['main']);
const ciIgnoreOk = bypass.every(
  (p) => (ciPush['paths-ignore'] || []).includes(p) && (ciPr['paths-ignore'] || []).includes(p),
);
if (ciBranchesOk && ciIgnoreOk) {
  pass('ci.yml triggers: push dev + PR main, bypass paths ignored');
} else {
  fail(`ci.yml triggers wrong (branches ok: ${ciBranchesOk}, paths-ignore ok: ${ciIgnoreOk})`);
}

// 3. content.yml triggers ONLY on the bypass paths (both push and PR).
const cPush = contentOn?.push || {};
const cPr = contentOn?.pull_request || {};
const sorted = (a) => [...(a || [])].sort();
const cPathsOk =
  JSON.stringify(sorted(cPush.paths)) === JSON.stringify(sorted(bypass)) &&
  JSON.stringify(sorted(cPr.paths)) === JSON.stringify(sorted(bypass)) &&
  !cPush['paths-ignore'] && !cPr['paths-ignore'];
if (cPathsOk) {
  pass('content.yml triggers only on the ratified bypass paths');
} else {
  fail(`content.yml trigger paths wrong: push=${JSON.stringify(cPush.paths)} pr=${JSON.stringify(cPr.paths)}`);
}

// 4. content.yml runs build + test:t2 only.
const cRuns = (content.jobs?.validate?.steps || []).map((s) => s.run || '').filter(Boolean);
const cStepsOk =
  cRuns.some((r) => r.includes('npm run build')) &&
  cRuns.some((r) => r.includes('npm run test:t2')) &&
  !cRuns.some((r) => /npm run test:(?!t2\b)/.test(r));
if (cStepsOk) {
  pass('content.yml runs build + test:t2 only');
} else {
  fail(`content.yml steps wrong: ${JSON.stringify(cRuns)}`);
}

// 5. notify-failure exists with if: failure() and reads the webhook
//    secret/var without inventing a destination.
const nf = ci.jobs?.['notify-failure'];
const nfText = JSON.stringify(nf || {});
if (nf && nf.if === 'failure()' &&
    nfText.includes('secrets.ALERT_WEBHOOK_URL') &&
    nfText.includes('vars.ALERT_CHANNEL') &&
    nfText.includes('alert stub: no channel configured')) {
  pass('notify-failure: if failure(), webhook secret/var, stub fallback');
} else {
  fail('notify-failure job missing or mis-wired');
}

// 6. notify-indexnow is main-gated and is a labeled no-op stub.
const ni = ci.jobs?.['notify-indexnow'];
const niText = JSON.stringify(ni || {});
if (ni && ni.if === "github.ref == 'refs/heads/main'" &&
    niText.includes('enable at hosting ratification')) {
  pass('notify-indexnow: main-gated, labeled stub');
} else {
  fail('notify-indexnow job missing, not main-gated, or unlabeled');
}

// 7. The IndexNow key file exists in public/ and its filename appears in
//    the ci.yml curl line with the SITE host.
const siteSrc = fs.readFileSync('src/config/site.ts', 'utf8');
const host = (siteSrc.match(/SITE\s*=\s*'https:\/\/([^']+)'/) || [])[1];
const keyFile = fs.readdirSync('public/').find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) {
  fail('no IndexNow key file (32-hex .txt) in public/');
} else {
  const key = keyFile.replace(/\.txt$/, '');
  const body = fs.readFileSync(`public/${keyFile}`, 'utf8').trim();
  if (body !== key) {
    fail(`public/${keyFile} content does not equal the key`);
  } else {
    pass(`IndexNow key file public/${keyFile} content matches filename`);
  }
  const curlLine = ciText.split('\n').find((l) => l.includes('api.indexnow.org'));
  const keyLine = ciText.split('\n').find((l) => l.includes('keyLocation'));
  if (curlLine && keyLine && keyLine.includes(keyFile) && host && keyLine.includes(host)) {
    pass(`ci.yml curl references ${keyFile} and host ${host}`);
  } else {
    fail('ci.yml curl line does not reference the key filename + SITE host');
  }
  // 8. Key file ships in dist/ (build must have run — run a fresh one if not).
  if (fs.existsSync(`dist/${keyFile}`)) {
    pass(`dist/${keyFile} present (build copies the key file)`);
  } else {
    fail(`dist/${keyFile} missing — build did not ship the key file`);
  }
}

process.exit(failed ? 1 : 0);
EOF
[ $? -eq 0 ] || fail "workflow assertions"

echo "All T11 checks passed."
