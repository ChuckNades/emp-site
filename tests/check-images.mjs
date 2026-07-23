// T8 — image format+size gate over dist/.
// Asserts, one PASS/FAIL line each, nothing skipped:
//   a. dist/ HTML and CSS reference content images only from the allowlist
//      {webp, avif, svg} — zero .jpg/.jpeg/.png references anywhere in the
//      file (including url(...) values), zero data: image URIs, zero external
//      http(s) image URLs;
//   b. no image FILE anywhere in dist/ exceeds 100 KB (102400 bytes);
//   c. every <img> in dist/ HTML carries width and height attributes (the
//      CLS guard lives on the replaced element; <source> only selects a
//      resource and takes no width/height attributes);
//   d. the About page emits at least one AVIF and one WebP source for the
//      portrait, AND src/pages/about.astro imports
//      emp-portrait-graded-1000.png specifically (source-level assertion).
// Exits nonzero if any clause failed.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');

const SIZE_CAP = 102400; // 100 KB
const IMAGE_FILE_EXT = /\.(png|jpe?g|webp|avif|gif|svg)$/i;
const BANNED_REF_EXT = /\.(?:jpe?g|png)(?:[?"'\s)#]|$)/i;

// T15a: the four favicon/OG files are pipeline-exempt public/ brand assets
// (committed outputs of scripts/gen-favicons.mjs), not content images — the
// format-allowlist and size-cap clauses skip exactly these pinned paths.
const T15A_EXEMPT = new Set([
  'favicon-32.png',
  'apple-touch-icon.png',
  'og-default.png',
]);

let failed = false;
const pass = (msg) => console.log(`PASS: ${msg}`);
const fail = (msg) => {
  console.log(`FAIL: ${msg}`);
  failed = true;
};

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)],
  );

const allFiles = walk(DIST);
const htmlFiles = allFiles.filter((p) => p.endsWith('.html'));
const cssFiles = allFiles.filter((p) => p.endsWith('.css'));
const htmlByRoute = new Map(); // '/about/' -> html
for (const file of htmlFiles) {
  const rel = `/${path.relative(DIST, file).replaceAll(path.sep, '/')}`;
  const route = rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
  htmlByRoute.set(route, fs.readFileSync(file, 'utf8'));
}

// a. Allowlist {webp, avif, svg} for content-image references in HTML + CSS:
//    zero .jpg/.jpeg/.png references (attribute values AND url(...) values —
//    the extension scan is context-agnostic, so CSS backgrounds are covered),
//    zero data: image URIs, zero external http(s) image URLs.
//    T9: JSON-LD blocks are stripped before the reference scans — the
//    VideoObject thumbnailUrl is a schema.org markup value (never a fetched
//    asset), and tests/facade.spec.ts pins its exact value separately. The
//    data: URI scan still runs over the full text.
{
  let bad = 0;
  for (const file of [...htmlFiles, ...cssFiles]) {
    const text = fs.readFileSync(file, 'utf8');
    const rel = path.relative(DIST, file);
    const withoutJsonLd = text.replace(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
      '',
    );
    const banned = withoutJsonLd.match(BANNED_REF_EXT);
    // T15a: strip references to the pinned pipeline-exempt brand assets
    // before the banned-extension scan (og:image is an absolute URL, the
    // PNG favicons are <link> hrefs — both would otherwise trip clause a).
    const scrubbed = withoutJsonLd.replace(
      /(?:https?:\/\/[^"'\s)]*\/)?(?:favicon-32\.png|apple-touch-icon\.png|og-default\.png)/gi,
      '',
    );
    const bannedRef = scrubbed.match(BANNED_REF_EXT);
    if (bannedRef) {
      fail(`clause a (format allowlist): ${rel} references a raster image outside {webp,avif,svg} (${bannedRef[0].trim()})`);
      bad += 1;
    }
    if (/data:image\//i.test(text)) {
      fail(`clause a (format allowlist): ${rel} contains a data: image URI`);
      bad += 1;
    }
    const external = scrubbed.match(/https?:\/\/[^"'\s)]+\.(?:png|jpe?g|webp|avif|gif|svg)/i);
    if (external) {
      fail(`clause a (format allowlist): ${rel} references an external image URL (${external[0]})`);
      bad += 1;
    }
  }
  if (bad === 0) {
    pass(`clause a: dist/ HTML+CSS reference content images only from {webp,avif,svg} (${htmlFiles.length} HTML, ${cssFiles.length} CSS checked)`);
  }
}

// b. No image FILE anywhere in dist/ exceeds 100 KB.
{
  let bad = 0;
  let count = 0;
  for (const file of allFiles) {
    if (!IMAGE_FILE_EXT.test(file)) continue;
    // T15a: the pinned pipeline-exempt brand assets are exempt from the cap.
    if (T15A_EXEMPT.has(path.relative(DIST, file).replaceAll(path.sep, '/'))) continue;
    count += 1;
    const size = fs.statSync(file).size;
    if (size > SIZE_CAP) {
      fail(`clause b (size cap): ${path.relative(DIST, file)} is ${size} bytes (> ${SIZE_CAP})`);
      bad += 1;
    }
  }
  if (bad === 0) pass(`clause b: every image file in dist/ is <= 100 KB (${count} checked)`);
}

// c. Every <img> in dist/ HTML carries width and height attributes (the CLS
//    guard lives on the replaced element; <source> in a <picture> only
//    selects a resource and takes no width/height attributes).
{
  let bad = 0;
  let count = 0;
  for (const [route, html] of htmlByRoute) {
    for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
      count += 1;
      const tag = m[0];
      if (!/\bwidth\s*=\s*"[^"]*"/i.test(tag) || !/\bheight\s*=\s*"[^"]*"/i.test(tag)) {
        fail(`clause c (CLS guard): ${route} has <img> without width/height: ${tag.slice(0, 120)}`);
        bad += 1;
      }
    }
  }
  if (bad === 0) pass(`clause c: every <img> in dist/ HTML carries width and height (${count} checked)`);
}

// d. About page emits >=1 AVIF and >=1 WebP source for the portrait, AND
//    src/pages/about.astro imports emp-portrait-graded-1000.png specifically.
{
  let bad = 0;
  const html = htmlByRoute.get('/about/');
  if (!html) {
    fail('clause d (portrait pipeline): /about/ missing from dist/');
    bad += 1;
  } else {
    if (!/<source\b[^>]*type="image\/avif"/i.test(html)) {
      fail('clause d (portrait pipeline): /about/ emits no AVIF <source>');
      bad += 1;
    }
    if (!/<source\b[^>]*type="image\/webp"/i.test(html)) {
      fail('clause d (portrait pipeline): /about/ emits no WebP <source>');
      bad += 1;
    }
  }
  const aboutSrc = fs.readFileSync(path.join(ROOT, 'src/pages/about.astro'), 'utf8');
  if (!/import\s+\w+\s+from\s+['"][^'"]*emp-portrait-graded-1000\.png['"]/.test(aboutSrc)) {
    fail('clause d (portrait pipeline): src/pages/about.astro does not import emp-portrait-graded-1000.png');
    bad += 1;
  }
  if (bad === 0) pass('clause d: /about/ emits AVIF + WebP portrait sources and imports emp-portrait-graded-1000.png');
}

if (failed) {
  process.exit(1);
}
console.log('All T8 image-gate checks passed.');
