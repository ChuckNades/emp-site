// T18 — surface guardrails over a CLEAN production dist/ (no fixtures).
// Reads hubs.ts and facts.ts (compiled from TS so values are never
// re-hardcoded here), then asserts:
//   1. Exact route allowlist: the set of built routes (every dist/**/index.html
//      plus root files) equals EXACTLY the ratified set — /, /about/,
//      /results/, /contact/, /faq/, the three hub roots from hubs.ts,
//      /huntsville/, /birmingham/, /alabama/, /tennessee/, /mississippi/,
//      /market/huntsville/, /podcast/, /videos/, /404 if Astro emits one —
//      plus root artifacts (robots.txt, llms.txt, sitemap-index.xml,
//      sitemap-0.xml, favicon.svg, favicon-32.png, apple-touch-icon.png,
//      og-default.png, the one IndexNow key .txt whose name matches the
//      committed public/ key file). `_astro/**` is the ONLY wildcard bucket,
//      and only for extensions {css,js,webp,avif,svg,woff2}.
//      Collection-derived child pages are allowed ONLY under their parents
//      (learn/grow/become/podcast/videos slugs from non-draft entries — in a
//      clean build there are none). ANY surplus route or file class = FAIL,
//      listed by path.
//   2. Capture elements: zero <form>/<input>/<textarea>/<select> in dist
//      EXCEPT inside the single [data-tool-island] element per page where it
//      appears (/, /huntsville/).
//   3. areaServed: every areaServed value in any JSON-LD equals exactly the
//      facts.ts licensure states; zero values outside it.
//   4. No subscribe/newsletter surfaces: case-insensitive scan of dist HTML
//      for subscribe|newsletter|sign[ -]?up|mailing list = 0 hits.
// Exits nonzero if any guardrail fails; prints a per-guardrail PASS line.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');

let failed = false;
const pass = (msg) => console.log(`PASS: ${msg}`);
const fail = (msg) => {
  console.log(`FAIL: ${msg}`);
  failed = true;
};

// --- Compile and import the TS source-of-truth modules (same mechanism as
//     check-t17.mjs) so the test never re-hardcodes a value.
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

const { HUB_SLUGS } = await importTs('src/config/hubs.ts', 't18-hubs.mjs');
const { licensureStates } = await importTs('src/data/facts.ts', 't18-facts.mjs');

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)],
  );

if (!fs.existsSync(DIST)) {
  fail('dist/ missing — run-t18.sh must build first');
  finish();
}

const allFiles = walk(DIST).map((f) => path.relative(DIST, f).split(path.sep).join('/'));
const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));

// Map a dist-relative html file to its route (trailing-slash form).
const routeOf = (file) => {
  if (file === 'index.html') return '/';
  if (file === '404.html') return '/404';
  if (file.endsWith('/index.html')) return `/${file.slice(0, -'index.html'.length)}`;
  return null;
};

// =========================================================================
// Guardrail 1 — exact route allowlist.
// =========================================================================
{
  // Ratified page routes (trailing-slash form; a route exists when dist
  // carries its index.html — or 404.html for the /404 route).
  const ratifiedRoutes = new Set([
    '/',
    '/about/',
    '/results/',
    '/contact/',
    '/faq/',
    ...Object.values(HUB_SLUGS), // the three hub roots from hubs.ts
    '/huntsville/',
    '/birmingham/',
    '/alabama/',
    '/tennessee/',
    '/mississippi/',
    '/market/huntsville/',
    '/podcast/',
    '/videos/',
  ]);

  // Ratified root artifacts — exact set.
  const ratifiedRootFiles = new Set([
    'robots.txt',
    'llms.txt',
    'sitemap-index.xml',
    'sitemap-0.xml',
    'favicon.svg',
    'favicon-32.png',
    'apple-touch-icon.png',
    'og-default.png',
  ]);

  // The one IndexNow key .txt whose name matches the committed public/ key.
  const keyFiles = fs.readdirSync(path.join(ROOT, 'public')).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (keyFiles.length !== 1) {
    fail(`route allowlist: expected exactly 1 IndexNow key file in public/, found ${keyFiles.length}`);
  } else {
    ratifiedRootFiles.add(keyFiles[0]);
  }

  // Collection-derived child pages allowed ONLY under their parents. In a
  // clean build (no fixtures) src/content/ carries no collection entries, so
  // the allowed set is empty — but derive it from non-draft entries anyway so
  // the guardrail stays correct if content ever ships.
  const CONTENT = path.join(ROOT, 'src/content');
  const childAllowed = []; // routes like /learn/<slug>/
  const readEntries = (col) => {
    const dir = path.join(CONTENT, col);
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(md|mdx)$/.test(f))
      .map((f) => fs.readFileSync(path.join(dir, f), 'utf8'))
      .filter((text) => !/^draft:\s*true\s*$/m.test(text));
  };
  const slugOf = (text) => (text.match(/^slug:\s*['"]?([A-Za-z0-9-]+)['"]?\s*$/m) || [])[1];
  for (const text of readEntries('posts')) {
    const slug = slugOf(text);
    const cat = (text.match(/^category:\s*['"]?([a-z]+)['"]?\s*$/m) || [])[1];
    if (slug && cat && HUB_SLUGS[cat]) childAllowed.push(`${HUB_SLUGS[cat]}${slug}/`);
  }
  for (const [col, parent] of [
    ['shownotes', '/podcast/'],
    ['videos', '/videos/'],
  ]) {
    for (const text of readEntries(col)) {
      const slug = slugOf(text);
      if (slug) childAllowed.push(`${parent}${slug}/`);
    }
  }

  const surplus = [];
  const missing = [];
  const seenRoutes = new Set();

  for (const file of allFiles) {
    if (file.startsWith('_astro/')) {
      // The ONLY wildcard bucket, and only for these extensions.
      if (!/\.(css|js|webp|avif|svg|woff2)$/.test(file)) {
        surplus.push(`${file} (_astro extension not in {css,js,webp,avif,svg,woff2})`);
      }
      continue;
    }
    const route = routeOf(file);
    if (route) {
      seenRoutes.add(route);
      if (ratifiedRoutes.has(route) || route === '/404' || childAllowed.includes(route)) continue;
      surplus.push(`${file} (route ${route} not in the allowlist)`);
      continue;
    }
    if (!file.includes('/') && ratifiedRootFiles.has(file)) continue;
    surplus.push(`${file} (file class not ratified)`);
  }

  for (const route of ratifiedRoutes) {
    if (!seenRoutes.has(route)) missing.push(route);
  }

  if (surplus.length === 0 && missing.length === 0 && keyFiles.length === 1) {
    pass(
      `route allowlist: dist routes + root files equal EXACTLY the ratified set (${ratifiedRoutes.size} routes, ${ratifiedRootFiles.size} root artifacts, _astro/** limited to {css,js,webp,avif,svg,woff2})`,
    );
  } else {
    if (surplus.length > 0) fail(`route allowlist: surplus route/file class(es):\n  ${surplus.join('\n  ')}`);
    if (missing.length > 0) fail(`route allowlist: ratified route(s) missing from dist: ${missing.join(', ')}`);
  }
}

// =========================================================================
// Guardrail 2 — capture elements only inside the single [data-tool-island].
// =========================================================================
{
  const CAPTURE = /<(form|input|textarea|select)\b/i;
  const ISLAND_PAGES = new Set(['/', '/huntsville/']);
  const surplus = [];

  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(DIST, file), 'utf8');
    const route = routeOf(file) ?? file;
    const islands = [...html.matchAll(/<section\b[^>]*\bdata-tool-island\b[^>]*>[\s\S]*?<\/section>/gi)];
    const outside = islands.reduce((h, m) => h.replace(m[0], ''), html);
    if (CAPTURE.test(outside)) {
      const tags = [...outside.matchAll(/<(form|input|textarea|select)\b/gi)].map((m) => m[1].toLowerCase());
      surplus.push(`${route} (capture element(s) outside [data-tool-island]: ${[...new Set(tags)].join(', ')})`);
    }
    if (islands.length > 0) {
      if (!ISLAND_PAGES.has(route)) {
        surplus.push(`${route} ([data-tool-island] present on a non-island page)`);
      } else if (islands.length !== 1) {
        surplus.push(`${route} (expected exactly 1 [data-tool-island], found ${islands.length})`);
      }
    }
  }

  if (surplus.length === 0) {
    pass('capture elements: zero <form>/<input>/<textarea>/<select> outside the single [data-tool-island] on / and /huntsville/');
  } else {
    fail(`capture elements:\n  ${surplus.join('\n  ')}`);
  }
}

// =========================================================================
// Guardrail 3 — every areaServed value equals exactly the licensure states.
// =========================================================================
{
  const expected = JSON.stringify([...licensureStates].sort());
  const bad = [];
  let seen = 0;

  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(DIST, file), 'utf8');
    const route = routeOf(file) ?? file;
    const blocks = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
    const nodes = [];
    for (const b of blocks) {
      try {
        const parsed = JSON.parse(b[1]);
        (Array.isArray(parsed) ? parsed : [parsed]).forEach((n) => nodes.push(n));
      } catch {
        bad.push(`${route} (unparseable JSON-LD block)`);
      }
    }
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if ('areaServed' in node) {
        seen += 1;
        const values = (Array.isArray(node.areaServed) ? node.areaServed : [node.areaServed]).map((v) =>
          typeof v === 'string' ? v : JSON.stringify(v),
        );
        if (JSON.stringify([...values].sort()) !== expected) {
          bad.push(`${route} (areaServed ${JSON.stringify(values)} != licensure states ${expected})`);
        }
      }
      for (const v of Object.values(node)) {
        if (v && typeof v === 'object') {
          if (Array.isArray(v)) v.forEach(visit);
          else visit(v);
        }
      }
    };
    nodes.forEach(visit);
  }

  if (bad.length === 0) {
    pass(`areaServed: every value in any JSON-LD equals exactly the facts.ts licensure states (${seen} occurrence(s), zero outside)`);
  } else {
    fail(`areaServed:\n  ${bad.join('\n  ')}`);
  }
}

// =========================================================================
// Guardrail 4 — no subscribe/newsletter surfaces in dist HTML.
// =========================================================================
{
  const PATTERN = /subscribe|newsletter|sign[ -]?up|mailing list/i;
  const hits = [];
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(DIST, file), 'utf8');
    if (PATTERN.test(html)) hits.push(routeOf(file) ?? file);
  }
  if (hits.length === 0) {
    pass('subscribe/newsletter: 0 hits for subscribe|newsletter|sign[ -]?up|mailing list (case-insensitive) in dist HTML');
  } else {
    fail(`subscribe/newsletter: hit(s) in: ${hits.join(', ')}`);
  }
}

function finish() {
  if (failed) {
    process.exit(1);
  }
  console.log('All T18 checks passed.');
  process.exit(0);
}

finish();
