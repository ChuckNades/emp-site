#!/usr/bin/env bash
# T5 test mechanism: geo hubs + state pages.
# Exits nonzero on any failure; prints a per-check PASS line.
set -u
cd "$(dirname "$0")/.."

pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; exit 1; }

GEO_ROUTES="huntsville birmingham alabama tennessee mississippi"
CITY_HUBS="huntsville birmingham"
STATE_PAGES="alabama tennessee mississippi"

# a. Build; all 5 routes exist in dist/.
if npm run build >/dev/null 2>&1; then
  pass "build"
else
  fail "build (npm run build exited nonzero)"
fi
for route in $GEO_ROUTES; do
  [ -f "dist/$route/index.html" ] || fail "route /$route/ (dist/$route/index.html missing)"
done
pass "all 5 geo routes exist in dist/"

# b. Zero address/NMLS/licensure string literals in templates — facts.ts is the
#    only source. "55223" and street-address patterns must not appear in
#    src/pages/** or src/layouts/**.
hits="$(grep -rn -e '55223' src/pages/ src/layouts/ | wc -l)"
[ "$hits" -eq 0 ] || fail "NMLS literal ('55223' found $hits time(s) in src/pages/ or src/layouts/)"
hits="$(grep -rn -E '[0-9]+ [A-Z][A-Za-z]+ (Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct|Parkway|Pkwy|Highway|Hwy)' src/pages/ src/layouts/ | wc -l)"
[ "$hits" -eq 0 ] || fail "street-address literal ($hits match(es) in src/pages/ or src/layouts/)"
pass "zero address/NMLS literals in templates"

# Per-route wiring: each city hub references its own facts field and not the other's.
grep -q 'huntsvilleAddress' src/pages/huntsville.astro \
  || fail "wiring (src/pages/huntsville.astro does not reference huntsvilleAddress)"
grep -q 'birminghamAddress' src/pages/huntsville.astro \
  && fail "wiring (src/pages/huntsville.astro references birminghamAddress)"
grep -q 'birminghamAddress' src/pages/birmingham.astro \
  || fail "wiring (src/pages/birmingham.astro does not reference birminghamAddress)"
grep -q 'huntsvilleAddress' src/pages/birmingham.astro \
  && fail "wiring (src/pages/birmingham.astro references huntsvilleAddress)"
pass "per-hub facts wiring (huntsvilleAddress / birminghamAddress)"

# c. Every areaServed in dist JSON-LD equals exactly ["AL","TN","MS"].
node - <<'EOF' || exit 1
const fs = require('fs');
const path = require('path');

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)],
  );

const EXPECTED = JSON.stringify(['AL', 'TN', 'MS']);
let checked = 0;
let bad = 0;
for (const file of walk('dist').filter((p) => p.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  const blocks = [
    ...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];
  for (const block of blocks) {
    const seen = [];
    const flatten = (node) => {
      if (Array.isArray(node)) node.forEach(flatten);
      else if (node && typeof node === 'object') {
        if (Array.isArray(node['@graph'])) flatten(node['@graph']);
        else seen.push(node);
      }
    };
    flatten(JSON.parse(block[1]));
    for (const node of seen) {
      if ('areaServed' in node) {
        checked += 1;
        const actual = JSON.stringify(node.areaServed);
        if (actual !== EXPECTED) {
          console.error(`FAIL: areaServed in ${file} is ${actual}, expected ${EXPECTED}`);
          bad += 1;
        }
      }
    }
  }
}
if (bad > 0) process.exit(1);
if (checked === 0) {
  console.error('FAIL: no areaServed found in any dist JSON-LD');
  process.exit(1);
}
console.log(`PASS: every areaServed in dist JSON-LD equals ["AL","TN","MS"] (${checked} checked)`);
EOF

# d. City-hub distinctness: title/meta/H1 differ, each hub has >=2 headings
#    absent from the other, and the two hubs' <main> innerHTML are not identical.
node - <<'EOF' || exit 1
const fs = require('fs');

const hubs = {
  huntsville: fs.readFileSync('dist/huntsville/index.html', 'utf8'),
  birmingham: fs.readFileSync('dist/birmingham/index.html', 'utf8'),
};

const fail = (msg) => { console.error(`FAIL: city-hub distinctness (${msg})`); process.exit(1); };

const extract = (html, re, label) => {
  const m = html.match(re);
  if (!m) fail(`could not extract ${label}`);
  return m[1].trim();
};

const titles = {};
const metas = {};
const h1s = {};
const headings = {};
const mains = {};
for (const [name, html] of Object.entries(hubs)) {
  titles[name] = extract(html, /<title>([\s\S]*?)<\/title>/i, 'title');
  metas[name] = extract(html, /<meta\s+name="description"\s+content="([^"]*)"/i, 'meta description');
  h1s[name] = extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i, 'H1');
  headings[name] = [...html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, '').trim(),
  );
  mains[name] = extract(html, /<main>([\s\S]*?)<\/main>/i, '<main>');
}

if (titles.huntsville === titles.birmingham) fail(`titles identical ("${titles.huntsville}")`);
if (metas.huntsville === metas.birmingham) fail(`meta descriptions identical ("${metas.huntsville}")`);
if (h1s.huntsville === h1s.birmingham) fail(`H1s identical ("${h1s.huntsville}")`);

for (const [name, other] of [['huntsville', 'birmingham'], ['birmingham', 'huntsville']]) {
  const unique = headings[name].filter((h) => !headings[other].includes(h));
  if (unique.length < 2)
    fail(`/${name}/ has ${unique.length} heading(s) absent from /${other}/ (need >=2)`);
}

if (mains.huntsville === mains.birmingham) fail('<main> innerHTML identical across hubs');

console.log('PASS: city-hub distinctness (title/meta/H1 differ, >=2 unique headings each, <main> differs)');
EOF

# e. State pages contain the licensure placeholder element and both city-hub links.
for route in $STATE_PAGES; do
  grep -q 'id="licensure"' "dist/$route/index.html" \
    || fail "state page /$route/ (licensure placeholder element missing)"
  grep -q 'href="/huntsville/"' "dist/$route/index.html" \
    || fail "state page /$route/ (link to /huntsville/ missing)"
  grep -q 'href="/birmingham/"' "dist/$route/index.html" \
    || fail "state page /$route/ (link to /birmingham/ missing)"
done
pass "state pages: licensure placeholder + both city-hub links"

# f. Forbidden-copy scan over the five new pages: 0 hits for serving-area
#    phrasing and capture elements.
for route in $GEO_ROUTES; do
  if grep -qi -e 'serving [a-z]' -e 'proudly serving' -e 'surrounding areas' "dist/$route/index.html"; then
    fail "forbidden copy (serving-area phrasing on /$route/)"
  fi
  if grep -qi -e '<form' -e '<input' "dist/$route/index.html"; then
    fail "forbidden copy (capture element on /$route/)"
  fi
done
pass "forbidden-copy scan (0 hits on all 5 geo pages)"

# g. JSON-LD validator covers the new routes (it walks all of dist/).
if npm run test:jsonld >/dev/null 2>&1; then
  pass "test:jsonld (all of dist, incl. geo routes)"
else
  fail "test:jsonld (exited nonzero)"
fi

echo "All T5 checks passed."
