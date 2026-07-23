// T17 — market report page checks over a fresh dist/.
// Reads the seed module (compiled from TS so values are never re-hardcoded
// here), then asserts the /market/huntsville/ page contract:
//   a. >=3 <table> each with a <caption> and <th scope="col">;
//   b. every displayed numeric table value exists in huntsville-seed.ts;
//   c. zero "HAAR" (case-insensitive) anywhere in dist/;
//   d. Dataset JSON-LD present with name/description/creator;
//   e. each series renders exactly one narrative sentence containing its first
//      and last values, and the page source imports market-narrative.ts;
//   e2. each series sourceUrl appears as an href on the built page.
// Exits nonzero on the first failing check.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');
const PAGE_ROUTE = '/market/huntsville/';
const PAGE_HTML = path.join(DIST, 'market/huntsville/index.html');
const PAGE_SRC = path.join(ROOT, 'src/pages/market/huntsville.astro');

let failed = false;
const pass = (msg) => console.log(`PASS: ${msg}`);
const fail = (msg) => {
  console.log(`FAIL: ${msg}`);
  failed = true;
};

// --- Compile and import the seed module so the test never re-hardcodes a value.
function importTs(relPath, cacheName) {
  const src = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const tmp = path.join(ROOT, 'node_modules/.cache', cacheName);
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, js);
  return import(pathToFileURL(tmp).href);
}

const { huntsvilleSeed } = await importTs('src/data/market/huntsville-seed.ts', 't17-seed.mjs');
const { marketNarrative, formatMarketValue } = await importTs(
  'src/lib/market-narrative.ts',
  't17-narrative.mjs',
);

// --- Load the built page.
if (!fs.existsSync(PAGE_HTML)) {
  fail(`route renders: ${PAGE_ROUTE} missing from dist/ (expected ${PAGE_HTML})`);
  finish();
}
const html = fs.readFileSync(PAGE_HTML, 'utf8');
pass(`route renders: ${PAGE_ROUTE} present in dist/`);

// The set of values the module authorizes for display, formatted exactly as the
// page formats them (via the shared formatMarketValue).
const allowedValues = new Set();
for (const series of huntsvilleSeed) {
  for (const row of series.rows) allowedValues.add(formatMarketValue(series, row.value));
}

// a. >=3 <table> each with a <caption> and a <th scope="col">.
{
  const tables = [...html.matchAll(/<table[\s>][\s\S]*?<\/table>/gi)].map((m) => m[0]);
  if (tables.length < 3) {
    fail(`tables: expected >=3 <table> elements, found ${tables.length}`);
  } else {
    let bad = 0;
    tables.forEach((t, i) => {
      if (!/<caption[\s>]/i.test(t)) {
        fail(`tables: table #${i + 1} missing <caption>`);
        bad += 1;
      }
      if (!/<th\s[^>]*scope="col"/i.test(t)) {
        fail(`tables: table #${i + 1} missing <th scope="col">`);
        bad += 1;
      }
    });
    if (bad === 0) pass(`tables: ${tables.length} <table> elements each with <caption> and <th scope="col">`);
  }
}

// b. Every numeric value displayed in a table cell exists in the seed module.
//    Only the VALUE column (the second <td> of each row) is checked — the first
//    <td> is the period label, which is not a data value.
{
  const cellValues = [];
  for (const row of html.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td>([\s\S]*?)<\/td>/gi)].map((c) => c[1].trim());
    if (cells.length >= 2) cellValues.push(cells[1]);
  }
  let bad = 0;
  for (const v of cellValues) {
    if (!allowedValues.has(v)) {
      fail(`values: displayed table value "${v}" is not in huntsville-seed.ts`);
      bad += 1;
    }
  }
  if (bad === 0) pass(`values: all ${cellValues.length} numeric table values exist in huntsville-seed.ts`);
}

// c. Zero "HAAR" (case-insensitive) in ANY file under dist/.
{
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
      d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)],
    );
  const hits = [];
  for (const file of walk(DIST)) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue; // binary asset — skip
    }
    if (/haar/i.test(content)) hits.push(path.relative(DIST, file));
  }
  if (hits.length === 0) {
    pass('HAAR: zero occurrences (case-insensitive) in any dist/ file');
  } else {
    fail(`HAAR: found in dist/ file(s): ${hits.join(', ')}`);
  }
}

// d. Dataset JSON-LD present with required props (name, description, creator).
{
  const blocks = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  const nodes = [];
  for (const b of blocks) {
    try {
      const parsed = JSON.parse(b[1]);
      (Array.isArray(parsed) ? parsed : [parsed]).forEach((n) => nodes.push(n));
    } catch {
      /* ignore */
    }
  }
  const datasets = nodes.filter((n) => n && n['@type'] === 'Dataset');
  if (datasets.length === 0) {
    fail('JSON-LD: no Dataset node found');
  } else {
    const d = datasets[0];
    const missing = ['name', 'description', 'creator'].filter((p) => !(p in d));
    if (missing.length > 0) {
      fail(`JSON-LD: Dataset missing required propert(ies): ${missing.join(', ')}`);
    } else {
      pass('JSON-LD: Dataset present with name, description, creator');
    }
  }
}

// e. Each series renders exactly one narrative sentence containing its first and
//    last values; the page source imports market-narrative.ts.
{
  let bad = 0;
  for (const series of huntsvilleSeed) {
    const sentence = marketNarrative(series);
    const occurrences = html.split(sentence).length - 1;
    if (occurrences !== 1) {
      fail(`narrative: expected exactly 1 rendering of "${sentence}", found ${occurrences}`);
      bad += 1;
      continue;
    }
    const first = formatMarketValue(series, series.rows[0].value);
    const last = formatMarketValue(series, series.rows[series.rows.length - 1].value);
    if (!sentence.includes(first) || !sentence.includes(last)) {
      fail(`narrative: sentence for "${series.label}" lacks first/last values`);
      bad += 1;
    }
  }
  const pageSrc = fs.readFileSync(PAGE_SRC, 'utf8');
  if (!/market-narrative/.test(pageSrc)) {
    fail('narrative: page source does not import market-narrative.ts');
    bad += 1;
  }
  if (bad === 0) pass('narrative: each series renders exactly one template sentence with first/last values; page imports market-narrative.ts');
}

// e2. Each series sourceUrl appears as an href on the built page.
{
  let bad = 0;
  for (const series of huntsvilleSeed) {
    if (!html.includes(`href="${series.sourceUrl}"`)) {
      fail(`attribution: sourceUrl for "${series.label}" not rendered as an href`);
      bad += 1;
    }
  }
  if (bad === 0) pass(`attribution: all ${huntsvilleSeed.length} sourceUrl(s) rendered as hrefs`);
}

function finish() {
  if (failed) {
    process.exit(1);
  }
  console.log('All T17 checks passed.');
  process.exit(0);
}

finish();
