#!/usr/bin/env bash
# T11 test mechanism: CI workflow wiring.
# Yaml-parses .github/workflows/ci.yml and content.yml (js-yaml from
# node_modules) and asserts: every test:* script in package.json (except
# test:t11 itself) appears as a named ci.yml step; both workflows trigger on
# all dev pushes + PRs into main and decide the lane by the SAME changed-paths
# (git diff) all-match guard — content.yml runs only when every changed path
# is ratified content, ci.yml skips exactly then; notify-failure exists with
# if: failure(); notify-indexnow is main-gated; the IndexNow key file exists
# in public/ and (after a build) in dist/, and its filename appears in the
# ci.yml curl line.
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

// 2. Both workflows trigger on ALL dev pushes and PRs into main (no
//    paths/paths-ignore filters — the lane is decided by a changed-paths
//    guard inside the job, not by GitHub's any-match path trigger).
const ciPush = ciOn?.push || {};
const ciPr = ciOn?.pull_request || {};
const cPush = contentOn?.push || {};
const cPr = contentOn?.pull_request || {};
const noPathFilter = (t) => !t.paths && !t['paths-ignore'];
const triggersOk =
  JSON.stringify(ciPush.branches) === JSON.stringify(['dev']) &&
  JSON.stringify(ciPr.branches) === JSON.stringify(['main']) &&
  JSON.stringify(cPush.branches) === JSON.stringify(['dev']) &&
  JSON.stringify(cPr.branches) === JSON.stringify(['main']) &&
  noPathFilter(ciPush) && noPathFilter(ciPr) && noPathFilter(cPush) && noPathFilter(cPr);
if (triggersOk) {
  pass('both workflows trigger on all dev pushes + PR main, no path filters');
} else {
  fail(`workflow triggers wrong (ci push=${JSON.stringify(ciPush)} pr=${JSON.stringify(ciPr)}; content push=${JSON.stringify(cPush)} pr=${JSON.stringify(cPr)})`);
}

// 3. The lane is decided by the SAME all-match changed-paths guard in both
//    workflows: a git diff --name-only against the before/base SHA whose
//    content-only test greps for any path OUTSIDE src/content/ or
//    src/assets/content/. content.yml runs only when content-only; ci.yml
//    skips exactly then — mutually exclusive by commit.
const guardBits = ['git diff --name-only', 'github.event.before', '^src/content/', '^src/assets/content/'];
const ciGuardOk = guardBits.every((b) => ciText.includes(b)) && /content-only/.test(ciText);
const contentGuardOk = guardBits.every((b) => contentText.includes(b)) && /content-only/.test(contentText);
if (ciGuardOk && contentGuardOk) {
  pass('both workflows gate on the same all-match changed-paths (git diff) guard');
} else {
  fail(`changed-paths guard missing (ci ok: ${ciGuardOk}, content ok: ${contentGuardOk})`);
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
