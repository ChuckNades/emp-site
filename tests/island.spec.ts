// T13 tool-island contract: the island is a crawler-visible SHELL with a
// reject-all token gate and a typed, URL-free endpoint contract — never a
// live tool. Asserts: (a) the form is in the RAW fetched HTML, (b) submit
// adds zero network requests across ALL origins, (c) the aria-live message
// appears, (d) no network primitives or lab URL literals exist in the source
// and the whole session touches only the preview origin, (e) placement and
// uniqueness of exactly one [data-tool-island] per page, (f) the island root
// carries data-tool-island.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const ISLAND_PAGES = ['/', '/huntsville/'];
const STATUS_MESSAGE = 'Verification required. This tool is not yet live.';

// d. Source-level greps (run once, in-process — the same patterns the task
//    lists, over the island component + lab.ts, and lab URL literals over
//    all of src/).
test('d. source: no network primitives in island/lab.ts, no lab URL literals in src/', () => {
  const islandSrc = fs.readFileSync(path.join(ROOT, 'src/components/ToolIsland.astro'), 'utf8');
  const labSrc = fs.readFileSync(path.join(ROOT, 'src/config/lab.ts'), 'utf8');
  const networkPrimitive =
    /fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|WebTransport|import\s*\(/;
  expect(networkPrimitive.test(islandSrc), 'network primitive in ToolIsland.astro').toBe(false);
  expect(networkPrimitive.test(labSrc), 'network primitive in lab.ts').toBe(false);

  // Lab URL literals anywhere in src/ (the v1 contract is deliberately
  // URL-free): any http(s) URL literal whose authority or path mentions the
  // lab endpoint. JSON-LD `url: SITE` fields are the canonical site origin,
  // never a lab endpoint, and are not matched.
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
      d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)],
    );
  const srcFiles = walk(path.join(ROOT, 'src')).filter((f) => /\.(ts|astro|tsx|js|mjs)$/.test(f));
  const labUrl = /https?:\/\/[^"'`\s]*lab/i;
  for (const file of srcFiles) {
    const text = fs.readFileSync(file, 'utf8');
    expect(labUrl.test(text), `lab URL literal in ${path.relative(ROOT, file)}`).toBe(false);
  }
});

for (const route of ISLAND_PAGES) {
  test(`a+f. ${route} raw HTML carries the form and the data-tool-island root`, async ({
    request,
  }) => {
    const response = await request.get(route);
    expect(response.ok()).toBeTruthy();
    const html = await response.text();

    // f. The island root carries data-tool-island (acceptance item).
    expect(html).toContain('data-tool-island');

    // a. Crawler-visible form surface in the RAW HTML. R8: the shell is
    //    inert without JS — the island form carries NO method= or action=
    //    attribute (a default GET onto self is still wrong); onsubmit is the
    //    markup-level backstop.
    const islandForm = html.match(/<form\b[^>]*>/i)?.[0] ?? '';
    expect(islandForm, 'form tag present in raw HTML').not.toBe('');
    expect(islandForm).not.toMatch(/\smethod\s*=/i);
    expect(islandForm).not.toMatch(/\saction\s*=/i);
    expect(islandForm).toMatch(/\sonsubmit\s*=\s*"return false"/i);
    expect(html).toMatch(/<label[^>]*for="loan-amount"[^>]*>\s*Loan amount\s*<\/label>/i);
    expect(html).toMatch(/<label[^>]*for="home-value"[^>]*>\s*Home value\s*<\/label>/i);
    expect(html).toMatch(/<input[^>]*id="loan-amount"[^>]*type="number"/i);
    expect(html).toMatch(/<input[^>]*id="home-value"[^>]*type="number"/i);
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>\s*Run analysis\s*<\/button>/i);
    expect(html).toMatch(/aria-live="polite"/i);
    // R8: the noscript notice ships in the raw HTML inside the island.
    expect(html).toMatch(/<noscript>\s*<p[^>]*>\s*This tool requires JavaScript and is not yet live\.\s*<\/p>\s*<\/noscript>/i);
  });

  test(`b+c+d. ${route} submit is fully network-inert and renders the aria-live message`, async ({
    page,
    baseURL,
  }) => {
    // Whole-session recorder: EVERY request, any origin, from load onward.
    const sessionRequests: string[] = [];
    page.on('request', (r) => sessionRequests.push(r.url()));

    await page.goto(route, { waitUntil: 'networkidle' });
    const afterLoad = sessionRequests.length;

    await page.getByLabel('Loan amount').fill('250000');
    await page.getByLabel('Home value').fill('400000');
    await page.getByRole('button', { name: 'Run analysis' }).click();

    // c. The aria-live message appears after submit.
    await expect(page.locator('[data-tool-island-status]')).toHaveText(STATUS_MESSAGE);

    // b. TOTAL network request-count delta across ALL origins added by the
    //    submit = 0 (2s settle to catch any deferred request).
    await page.waitForTimeout(2000);
    expect(sessionRequests.length - afterLoad).toBe(0);

    // d. Whole-session assertion: across the ENTIRE page session (load +
    //    submit + settle) the only request origins are the preview server's
    //    own — catches any request path, not just submit-time deltas.
    const selfOrigin = new URL(baseURL!).origin;
    const foreign = sessionRequests.filter((url) => new URL(url).origin !== selfOrigin);
    expect(foreign).toEqual([]);
  });
}

test('e. placement + uniqueness: exactly one island, only on / and /huntsville/, in order', async ({
  request,
}) => {
  // Exactly ONE data-tool-island element per island page, in the required
  // position inside <main>.
  for (const route of ISLAND_PAGES) {
    const html = await (await request.get(route)).text();
    const occurrences = html.match(/data-tool-island(?=[\s>])/g) ?? [];
    expect(occurrences.length, `${route} island count`).toBe(1);

    const main = html.match(/<main>([\s\S]*?)<\/main>/i)?.[1] ?? '';
    expect(main).toContain('data-tool-island');
    const islandAt = main.search(/<section\b[^>]*\bdata-tool-island\b/i);
    expect(islandAt, `${route} island inside <main>`).toBeGreaterThanOrEqual(0);

    if (route === '/') {
      // After the lane section (the <section> WITHOUT data-tool-island).
      const laneClose = main.search(/<section\b(?![^>]*data-tool-island)[^>]*>[\s\S]*?<\/section>/i);
      expect(laneClose, '/ lane section present').toBeGreaterThanOrEqual(0);
      expect(islandAt, '/ island after lane section').toBeGreaterThan(laneClose);
    } else {
      // After the market-link section (aria-labelledby="market").
      const marketClose = main.indexOf('</section>', main.search(/<section\b[^>]*aria-labelledby="market"/i));
      expect(marketClose, '/huntsville/ market-link section present').toBeGreaterThanOrEqual(0);
      expect(islandAt, '/huntsville/ island after market-link section').toBeGreaterThan(marketClose);
    }
  }

  // Zero occurrences on any other page: walk every built route in dist/.
  const DIST = path.join(ROOT, 'dist');
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
      d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)],
    );
  const htmlRoutes = walk(DIST)
    .filter((f) => f.endsWith('.html'))
    .map((f) => `/${path.relative(DIST, f).replaceAll(path.sep, '/')}`)
    .map((rel) => (rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel));
  for (const other of htmlRoutes) {
    if ((ISLAND_PAGES as string[]).includes(other)) continue;
    const response = await request.get(other);
    if (!response.ok()) continue; // e.g. /404.html served only on miss
    const html = await response.text();
    expect(html, `data-tool-island on ${other}`).not.toContain('data-tool-island');
  }
});
