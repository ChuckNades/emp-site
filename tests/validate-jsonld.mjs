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
  // T6: cluster articles — dateModified is emitted with the datePublished
  // fallback applied, so it is always present.
  Article: ['headline', 'author', 'datePublished', 'dateModified'],
  FAQPage: ['mainEntity'],
  // T9: video pages — embedUrl is required and contentUrl must never appear
  // (enforced in validatePage below).
  VideoObject: ['name', 'thumbnailUrl', 'uploadDate', 'embedUrl'],
};
const EXPECTED_AREA_SERVED = ['AL', 'TN', 'MS'];

// Hub route prefixes (first path segment) for the T6 cluster-page checks.
// Kept in sync with src/config/hubs.ts — the validator is plain .mjs and
// cannot import the TS map.
const HUB_ROUTE_PREFIXES = ['learn', 'grow', 'become'];

function isClusterPage(rel) {
  const segments = rel.split(path.sep);
  return (
    segments.length === 3 && HUB_ROUTE_PREFIXES.includes(segments[0]) && segments[2] === 'index.html'
  );
}

// T9: a video page is any /videos/<slug>/ page (never the /videos/ index).
function isVideoPage(rel) {
  const segments = rel.split(path.sep);
  return segments.length === 3 && segments[0] === 'videos' && segments[2] === 'index.html';
}

function isFaqHubPage(rel) {
  return rel === path.join('faq', 'index.html');
}

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
        } else if (type === 'FAQPage' && prop === 'mainEntity') {
          // Nonempty is enforced on the /faq/ hub below; an embedded-article
          // FAQPage is only emitted when the post carries faq pairs, and a
          // clean-repo /faq/ hub legitimately has zero entries.
          if (!Array.isArray(node[prop])) {
            failures.push('FAQPage mainEntity must be an array');
          }
        }
      }
    }
  }

  // T6 cluster-page assertions: Article + BreadcrumbList present (required
  // props checked above), and the canonical link equals the owning-hub URL —
  // i.e. the page's own path under its hub prefix.
  if (isClusterPage(rel)) {
    const articles = nodes.filter((n) =>
      (Array.isArray(n['@type']) ? n['@type'] : [n['@type']]).includes('Article'),
    );
    if (articles.length === 0) failures.push('cluster page missing Article JSON-LD');
    const breadcrumbs = nodes.filter((n) =>
      (Array.isArray(n['@type']) ? n['@type'] : [n['@type']]).includes('BreadcrumbList'),
    );
    if (breadcrumbs.length === 0) failures.push('cluster page missing BreadcrumbList JSON-LD');
    if (canonicals.length === 1) {
      const href = canonicals[0].match(/href=["']([^"']*)["']/i)?.[1];
      const expectedPath = `/${rel.split(path.sep).slice(0, 2).join('/')}/`;
      if (!href || new URL(href).pathname !== expectedPath) {
        failures.push(`canonical must equal the owning-hub URL "${expectedPath}", got "${href}"`);
      }
    }
  }

  // T6 /faq/ hub assertion: FAQPage mainEntity count equals the number of
  // visibly rendered questions (h2 elements in <main>). When questions are
  // rendered, mainEntity must be nonempty (it is, by the equality).
  if (isFaqHubPage(rel)) {
    const faqPages = nodes.filter((n) =>
      (Array.isArray(n['@type']) ? n['@type'] : [n['@type']]).includes('FAQPage'),
    );
    if (faqPages.length === 0) {
      failures.push('/faq/ missing FAQPage JSON-LD');
    } else {
      const rendered = html.match(/<main>[\s\S]*?<\/main>/i)?.[0] ?? '';
      const questionCount = (rendered.match(/<h2[\s>]/gi) ?? []).length;
      const entityCount = Array.isArray(faqPages[0].mainEntity) ? faqPages[0].mainEntity.length : 0;
      if (entityCount !== questionCount) {
        failures.push(
          `FAQPage mainEntity count (${entityCount}) must equal rendered question count (${questionCount})`,
        );
      }
      if (questionCount > 0 && entityCount === 0) {
        failures.push('FAQPage mainEntity must be nonempty when questions are rendered');
      }
    }
  }

  // T9 video-page assertions: VideoObject present (required props checked
  // above) and contentUrl never emitted — embeds only.
  if (isVideoPage(rel)) {
    const videos = nodes.filter((n) =>
      (Array.isArray(n['@type']) ? n['@type'] : [n['@type']]).includes('VideoObject'),
    );
    if (videos.length === 0) {
      failures.push('video page missing VideoObject JSON-LD');
    } else if (videos.some((v) => 'contentUrl' in v)) {
      failures.push('VideoObject must not emit contentUrl (embedUrl only)');
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
