// T7 — internal-link contract, floor not ceiling.
// Walks dist/ and asserts the floor items from T7-TASK.md (1–6) plus the T6b
// additions (7–9: home lane section, global nav, home <main> structure).
// Cross-lane links are permitted everywhere and never flagged; only the
// minimums below and broken links are checked. Exits nonzero on the first
// failing floor.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');

// --- hubs.ts is the only source of hub slugs; compile and import it so the
// script never hardcodes a hub-slug literal.
const hubsTs = fs.readFileSync(path.join(ROOT, 'src/config/hubs.ts'), 'utf8');
const hubsJs = ts.transpileModule(hubsTs, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const hubsTmp = path.join(ROOT, 'node_modules/.cache/t7-hubs.mjs');
fs.mkdirSync(path.dirname(hubsTmp), { recursive: true });
fs.writeFileSync(hubsTmp, hubsJs);
const { HUB_CATEGORIES, HUB_SLUGS, HUB_PARAMS } = await import(pathToFileURL(hubsTmp).href);

const CATEGORIES = HUB_CATEGORIES; // lane keys, e.g. learn / partners / originators
const hubPath = (category) => HUB_SLUGS[category]; // '/learn/' etc.
const articlePath = (category, slug) => `${hubPath(category)}${slug}/`;

// Geo routes (not hub-map entries; the hubs map covers content hubs only).
const CITY_HUBS = ['/huntsville/', '/birmingham/'];
const STATE_PAGES = ['/alabama/', '/tennessee/', '/mississippi/'];

// Allowlisted not-yet-built routes (empty — /market/huntsville/ now exists).
const ALLOWLIST = new Set();

let failed = false;
const pass = (msg) => console.log(`PASS: ${msg}`);
const fail = (msg) => {
  console.log(`FAIL: ${msg}`);
  failed = true;
};

// --- Parse the posts collection straight from the installed frontmatter so
// the sibling requirement is COMPUTED, never hardcoded.
function parsePosts() {
  const dir = path.join(ROOT, 'src/content/posts');
  const posts = [];
  if (!fs.existsSync(dir)) return posts;
  for (const name of fs.readdirSync(dir)) {
    if (!/\.(md|mdx)$/.test(name)) continue;
    const raw = fs.readFileSync(path.join(dir, name), 'utf8');
    const m = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!m) continue;
    const fm = m[1];
    const scalar = (key) => {
      const s = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
      return s ? s[1].trim().replace(/^["']|["']$/g, '') : undefined;
    };
    const list = (key) => {
      const block = fm.match(new RegExp(`^${key}:\\s*\\n((?:\\s+-[^\\n]*\\n?)+)`, 'm'));
      if (!block) return undefined;
      return [...block[1].matchAll(/^\s+-\s*(.+)$/gm)].map((x) =>
        x[1].trim().replace(/^["']|["']$/g, ''),
      );
    };
    posts.push({
      slug: scalar('slug'),
      category: scalar('category'),
      alsoRelevantTo: list('alsoRelevantTo') ?? [],
      draft: scalar('draft') === 'true',
    });
  }
  return posts;
}

const allPosts = parsePosts();
const posts = allPosts.filter((p) => !p.draft && p.slug && CATEGORIES.includes(p.category));

// --- dist/ walking helpers.
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)],
  );

const htmlFiles = walk(DIST).filter((p) => p.endsWith('.html'));
const htmlByRoute = new Map(); // '/learn/' -> html
for (const file of htmlFiles) {
  const rel = `/${path.relative(DIST, file).replaceAll(path.sep, '/')}`;
  const route = rel.endsWith('/index.html')
    ? rel.slice(0, -'index.html'.length)
    : rel; // e.g. '/404.html'
  htmlByRoute.set(route, fs.readFileSync(file, 'utf8'));
}

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const hrefsOf = (html) =>
  [...html.matchAll(/<a\s[^>]*?href="([^"]*)"/gi)].map((m) => decode(m[1]));

const idsOf = (html) =>
  new Set([...html.matchAll(/\sid="([^"]*)"/gi)].map((m) => decode(m[1])));

// Every href whose anchor text contains `text` (case-insensitive).
const hrefsWithText = (html, text) => {
  const out = [];
  const re = /<a\s[^>]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const m of html.matchAll(re)) {
    if (m[2].toLowerCase().includes(text.toLowerCase())) out.push(decode(m[1]));
  }
  return out;
};

// 1. Every cluster article page links to its owning hub.
{
  let bad = 0;
  for (const p of posts) {
    const route = articlePath(p.category, p.slug);
    const html = htmlByRoute.get(route);
    if (!html) {
      fail(`floor 1 (cluster -> owning hub): ${route} missing from dist/`);
      bad += 1;
      continue;
    }
    if (!hrefsOf(html).some((h) => h === hubPath(p.category))) {
      fail(`floor 1 (cluster -> owning hub): ${route} does not link to ${hubPath(p.category)}`);
      bad += 1;
    }
  }
  if (bad === 0) pass(`floor 1: every cluster article links to its owning hub (${posts.length} checked)`);
}

// 2. Every hub page links to every non-draft cluster whose category OR
//    alsoRelevantTo names it.
{
  let bad = 0;
  for (const category of CATEGORIES) {
    const html = htmlByRoute.get(hubPath(category));
    if (!html) {
      fail(`floor 2 (hub -> clusters): ${hubPath(category)} missing from dist/`);
      bad += 1;
      continue;
    }
    const hrefs = hrefsOf(html);
    for (const p of posts) {
      if (p.category !== category && !p.alsoRelevantTo.includes(category)) continue;
      const target = articlePath(p.category, p.slug); // canonical owning-hub URL
      if (!hrefs.includes(target)) {
        fail(`floor 2 (hub -> clusters): ${hubPath(category)} does not link to ${target}`);
        bad += 1;
      }
    }
  }
  if (bad === 0) pass('floor 2: every hub links to every cluster naming it (category or alsoRelevantTo)');
}

// 3. Every geo city hub links to the learn hub and the grow hub (slugs
//    resolved through hubs.ts).
{
  const required = [hubPath('learn'), hubPath('partners')];
  let bad = 0;
  for (const city of CITY_HUBS) {
    const html = htmlByRoute.get(city);
    if (!html) {
      fail(`floor 3 (city hub -> learn/grow): ${city} missing from dist/`);
      bad += 1;
      continue;
    }
    const hrefs = hrefsOf(html);
    for (const target of required) {
      if (!hrefs.includes(target)) {
        fail(`floor 3 (city hub -> learn/grow): ${city} does not link to ${target}`);
        bad += 1;
      }
    }
  }
  if (bad === 0) pass('floor 3: every geo city hub links to the learn hub and the grow hub');
}

// 4. Every state page links to both city hubs.
{
  let bad = 0;
  for (const state of STATE_PAGES) {
    const html = htmlByRoute.get(state);
    if (!html) {
      fail(`floor 4 (state -> city hubs): ${state} missing from dist/`);
      bad += 1;
      continue;
    }
    const hrefs = hrefsOf(html);
    for (const city of CITY_HUBS) {
      if (!hrefs.includes(city)) {
        fail(`floor 4 (state -> city hubs): ${state} does not link to ${city}`);
        bad += 1;
      }
    }
  }
  if (bad === 0) pass('floor 4: every state page links to both city hubs');
}

// 5. Every non-draft cluster links to >=2 DISTINCT sibling clusters of its
//    lane (or to ALL siblings when fewer than 3 exist). Requirement computed
//    from the collection.
{
  let bad = 0;
  for (const p of posts) {
    const siblings = posts.filter((q) => q.category === p.category && q.slug !== p.slug);
    const needed = Math.min(2, siblings.length);
    if (needed === 0) continue; // no siblings exist; nothing required
    const route = articlePath(p.category, p.slug);
    const html = htmlByRoute.get(route);
    if (!html) {
      fail(`floor 5 (siblings): ${route} missing from dist/`);
      bad += 1;
      continue;
    }
    const hrefs = hrefsOf(html);
    const linked = new Set(
      siblings
        .filter((s) => hrefs.includes(articlePath(s.category, s.slug)))
        .map((s) => s.slug),
    );
    if (linked.size < needed) {
      fail(
        `floor 5 (siblings): ${route} links to ${linked.size} distinct sibling(s), needs ${needed} of ${siblings.length}`,
      );
      bad += 1;
    }
  }
  if (bad === 0) pass('floor 5: every cluster links to >=2 distinct lane siblings (or all when <3 exist)');
}

// 6. Zero broken internal links anywhere in dist/. Fragment hrefs require the
//    target id to exist in the destination page. R1: relative hrefs are
//    resolved against the page's own route, then get the same existence
//    checks (none exist today — this guards the future).
{
  let bad = 0;
  for (const [route, html] of htmlByRoute) {
    const ids = idsOf(html);
    for (const href of hrefsOf(html)) {
      if (/^(https?:)?\/\//i.test(href) || /^(mailto|tel):/i.test(href)) continue;
      let resolved = href;
      if (!href.startsWith('/') && !href.startsWith('#')) {
        // Relative href: resolve against the page's route (a directory URL
        // ending in '/'), then fall through to the same checks.
        resolved = new URL(href, `https://local${route}`).pathname;
        if (resolved === route) continue; // resolves to the page itself
      }
      let targetRoute;
      let fragment;
      if (resolved.startsWith('#')) {
        targetRoute = route;
        fragment = resolved.slice(1);
      } else {
        const [p, f] = resolved.split('#');
        targetRoute = p;
        fragment = f;
      }
      if (targetRoute !== route && !htmlByRoute.has(targetRoute) && !ALLOWLIST.has(targetRoute)) {
        fail(`floor 6 (broken links): ${route} links to unbuilt route ${targetRoute}`);
        bad += 1;
        continue;
      }
      if (fragment) {
        const targetIds =
          targetRoute === route ? ids : htmlByRoute.has(targetRoute) ? idsOf(htmlByRoute.get(targetRoute)) : null;
        // Allowlisted routes are not built; their fragments cannot be checked.
        if (targetIds && !targetIds.has(fragment)) {
          fail(`floor 6 (broken links): ${route} links to ${href} but #${fragment} does not exist`);
          bad += 1;
        }
      }
    }
  }
  if (bad === 0) pass('floor 6: zero broken internal links in dist/ (fragments resolve to existing ids)');
}

// --- T6b additions: home lane-routing + global nav floors (scoped selectors,
//     never whole-page grep). T13 amended the home-exactness floor: home's
//     <main> is now h1 + lane section + the ONE tool-island section
//     ([data-tool-island]).

// Inner HTML of the first match of a paired tag (e.g. 'main', 'nav').
const innerOf = (html, tag) => html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))?.[1] ?? '';

// Inner HTML of the first <section> whose opening tag carries `attr`
// (e.g. 'data-tool-island'). Nested <section>s are not used on the checked
// pages, so a lazy match to the next </section> is exact here.
const innerOfSectionWith = (html, attr) =>
  html.match(new RegExp(`<section\\b[^>]*\\b${attr}\\b[^>]*>([\\s\\S]*?)</section>`, 'i'))?.[1] ?? '';

// 7. Home's lane section (the <section> inside <main> WITHOUT
//    data-tool-island — T13 added a second, island section) contains links
//    to all three hubs (slugs resolved through hubs.ts).
{
  const html = htmlByRoute.get('/');
  if (!html) {
    fail('floor 7 (home lane section): / missing from dist/');
  } else {
    const laneSection = innerOf(innerOf(html, 'main'), 'section');
    const hrefs = hrefsOf(laneSection);
    const missing = CATEGORIES.filter((category) => !hrefs.includes(hubPath(category)));
    if (missing.length > 0) {
      fail(`floor 7 (home lane section): missing hub link(s) for ${missing.join(', ')}`);
    } else {
      pass('floor 7: home lane section links to all three hubs');
    }
  }
}

// 8. The <nav> element on every page contains links to all three hubs and
//    /faq/, and carries aria-label="Main" (R1: the global nav landmark must
//    be labeled distinctly from breadcrumb/related navs).
{
  let bad = 0;
  for (const [route, html] of htmlByRoute) {
    const navMatch = html.match(/<nav\b[^>]*>/i);
    if (!navMatch || !/\baria-label="Main"/i.test(navMatch[0])) {
      fail(`floor 8 (global nav): ${route} <nav> missing aria-label="Main"`);
      bad += 1;
    }
    const hrefs = hrefsOf(innerOf(html, 'nav'));
    for (const target of [...CATEGORIES.map(hubPath), '/faq/']) {
      if (!hrefs.includes(target)) {
        fail(`floor 8 (global nav): ${route} <nav> does not link to ${target}`);
        bad += 1;
      }
    }
  }
  if (bad === 0) pass('floor 8: every page <nav> links to all three hubs and /faq/ and has aria-label="Main"');
}

// 9. Home's <main> contains exactly one <h1>, one lane <section>, and the ONE
//    T13 tool-island <section data-tool-island> — and no other element types
//    besides those, their children, and the ONE bundled island <script> that
//    Astro emits where the island component is used (T13-amended
//    home-exactness floor).
{
  const html = htmlByRoute.get('/');
  if (!html) {
    fail('floor 9 (home <main> structure): / missing from dist/');
  } else {
    const main = innerOf(html, 'main');
    const h1Count = (main.match(/<h1[\s>]/gi) ?? []).length;
    const sectionCount = (main.match(/<section[\s>]/gi) ?? []).length;
    const islandCount = (main.match(/<section\b[^>]*\bdata-tool-island\b/gi) ?? []).length;
    if (h1Count !== 1 || sectionCount !== 2 || islandCount !== 1) {
      fail(
        `floor 9 (home <main> structure): expected 1 <h1>, 2 <section> of which 1 is the tool island,` +
          ` found ${h1Count} <h1>, ${sectionCount} <section>, ${islandCount} island`,
      );
    } else {
      const laneSection = innerOf(main, 'section');
      const islandSection = innerOfSectionWith(main, 'data-tool-island');
      const outside = main
        .replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '')
        .replace(/<section\b(?![^>]*\bdata-tool-island\b)[^>]*>[\s\S]*?<\/section>/i, '')
        .replace(/<section\b[^>]*\bdata-tool-island\b[^>]*>[\s\S]*?<\/section>/i, '')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, ''); // the ONE bundled island script
      const extraTags = [...outside.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)/g)].map((m) => m[1]);
      const laneClean = /^[^<]*$/.test(laneSection.replace(/<\/?(?:ul|li|a)(\s[^>]*)?>/gi, ''));
      const islandClean = /^[^<]*$/.test(
        islandSection.replace(/<\/?(?:h2|form|div|label|input|button|p)(\s[^>]*)?>/gi, ''),
      );
      if (extraTags.length > 0 || !laneClean || !islandClean) {
        fail(
          `floor 9 (home <main> structure): unexpected element(s)` +
            (extraTags.length > 0 ? ` outside h1/sections: ${[...new Set(extraTags)].join(', ')}` : '') +
            (!laneClean ? ' inside the lane <section> beyond ul/li/a' : '') +
            (!islandClean ? ' inside the island <section> beyond h2/form/div/label/input/button/p' : ''),
        );
      } else {
        pass('floor 9: home <main> is exactly one <h1> plus the lane <section> plus the ONE tool-island <section>');
      }
    }
  }
}

if (failed) {
  process.exit(1);
}
console.log('All T7 link-contract checks passed.');
