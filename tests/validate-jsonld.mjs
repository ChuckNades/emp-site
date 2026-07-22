// T3 JSON-LD + canonical validator.
// Walks every built page in dist/, parses every <script type="application/ld+json">
// block, asserts exactly one canonical link per page, and checks required
// properties per schema type. Exits nonzero listing failures; prints per-page
// PASS otherwise.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve(import.meta.dirname, '..', 'dist');

// Required-properties assertion map. areaServed must equal exactly AL/TN/MS.
const REQUIRED = {
  MortgageBroker: ['name', 'address', 'areaServed'],
  Organization: ['name', 'url'],
  BreadcrumbList: ['itemListElement'],
  ProfilePage: ['mainEntity'],
  Person: ['name', 'sameAs'],
};
const EXPECTED_AREA_SERVED = ['AL', 'TN', 'MS'];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) yield full;
  }
}

function flattenJsonLd(node, out = []) {
  if (Array.isArray(node)) {
    for (const item of node) flattenJsonLd(item, out);
  } else if (node && typeof node === 'object') {
    if (Array.isArray(node['@graph'])) flattenJsonLd(node['@graph'], out);
    else out.push(node);
  }
  return out;
}

function validatePage(rel, html) {
  const failures = [];

  const canonicals = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi) ?? [];
  if (canonicals.length !== 1) {
    failures.push(`expected exactly 1 canonical link, found ${canonicals.length}`);
  }

  const blocks = [
    ...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];
  if (blocks.length === 0) failures.push('no JSON-LD blocks found');

  const nodes = [];
  for (const block of blocks) {
    try {
      flattenJsonLd(JSON.parse(block[1]), nodes);
    } catch (err) {
      failures.push(`invalid JSON-LD: ${err.message}`);
    }
  }

  for (const node of nodes) {
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    for (const type of types) {
      const required = REQUIRED[type];
      if (!required) continue;
      for (const prop of required) {
        if (!(prop in node)) {
          failures.push(`${type} missing required property "${prop}"`);
        } else if (type === 'BreadcrumbList' && prop === 'itemListElement') {
          if (!Array.isArray(node[prop]) || node[prop].length === 0) {
            failures.push('BreadcrumbList itemListElement must be a nonempty array');
          }
        } else if (type === 'MortgageBroker' && prop === 'areaServed') {
          const actual = JSON.stringify(node[prop]);
          if (actual !== JSON.stringify(EXPECTED_AREA_SERVED)) {
            failures.push(`MortgageBroker areaServed must equal ["AL","TN","MS"], got ${actual}`);
          }
        }
      }
    }
  }

  return failures;
}

let failed = false;
let pageCount = 0;
for await (const file of walk(DIST)) {
  pageCount += 1;
  const rel = path.relative(DIST, file);
  const html = await readFile(file, 'utf8');
  const failures = validatePage(rel, html);
  if (failures.length > 0) {
    failed = true;
    console.error(`FAIL ${rel}`);
    for (const f of failures) console.error(`  - ${f}`);
  } else {
    console.log(`PASS ${rel}`);
  }
}

if (pageCount === 0) {
  console.error('FAIL no HTML pages found in dist/ — run `npm run build` first');
  process.exit(1);
}
if (failed) process.exit(1);
