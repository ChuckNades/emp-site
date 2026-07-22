// T9 facade contract: the media facade must be network-inert until clicked,
// the initial HTML must carry no embed machinery, video pages must emit
// VideoObject JSON-LD with embedUrl (never contentUrl), and the new route
// families must be wired into the sitemap with <lastmod>.
import { test, expect } from '@playwright/test';

const MEDIA_HOSTS = ['youtube.com', 'ytimg.com', 'youtube-nocookie.com'];
const EMBED_HOSTS = ['youtube.com', 'ytimg.com', 'youtube-nocookie.com'];

function isMediaRequest(url: string): boolean {
  return MEDIA_HOSTS.some((host) => url.includes(host));
}

test('a. zero media-domain requests before interaction', async ({ page }) => {
  const mediaRequests: string[] = [];
  page.on('request', (request) => {
    if (isMediaRequest(request.url())) mediaRequests.push(request.url());
  });
  await page.goto('/videos/videos-fixture/', { waitUntil: 'networkidle' });
  expect(mediaRequests).toEqual([]);
});

test('b. clicking the facade loads the youtube-nocookie embed', async ({ page }) => {
  const embedRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('youtube-nocookie.com')) embedRequests.push(request.url());
  });
  await page.goto('/videos/videos-fixture/');
  await page.getByRole('button', { name: /play video/i }).click();
  await expect(page.locator('media-facade iframe')).toBeVisible();
  await page.waitForResponse((response) => response.url().includes('youtube-nocookie.com'), {
    timeout: 15_000,
  });
  expect(embedRequests.length).toBeGreaterThanOrEqual(1);
});

test('c. initial HTML has no iframe and no embed-domain strings outside noscript/JSON-LD', async ({
  request,
}) => {
  const response = await request.get('/videos/videos-fixture/');
  expect(response.ok()).toBeTruthy();
  const html = await response.text();

  expect(html).not.toMatch(/<iframe/i);
  expect(html).not.toMatch(/<script\b[^>]*\bsrc=/i);

  // Strip <noscript> blocks and JSON-LD script blocks, then assert no
  // embed-domain strings remain anywhere else in the initial HTML.
  const stripped = html
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
  for (const host of EMBED_HOSTS) {
    expect(stripped).not.toContain(host);
  }
});

test('d. VideoObject JSON-LD present with embedUrl and no contentUrl', async ({ request }) => {
  const response = await request.get('/videos/videos-fixture/');
  const html = await response.text();
  const blocks = [
    ...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];
  expect(blocks.length).toBeGreaterThan(0);
  const nodes: any[] = [];
  const flatten = (node: any) => {
    if (Array.isArray(node)) node.forEach(flatten);
    else if (node && typeof node === 'object') {
      if (Array.isArray(node['@graph'])) node['@graph'].forEach(flatten);
      else nodes.push(node);
    }
  };
  for (const block of blocks) flatten(JSON.parse(block[1]));
  const video = nodes.find((n) =>
    (Array.isArray(n['@type']) ? n['@type'] : [n['@type']]).includes('VideoObject'),
  );
  expect(video).toBeTruthy();
  expect(video.embedUrl).toBe('https://www.youtube-nocookie.com/embed/fixtureVideoId');
  expect(video).not.toHaveProperty('contentUrl');
  expect(video.name).toBe('FIXTURE: Video');
  expect(video.thumbnailUrl).toBe('https://i.ytimg.com/vi/fixtureVideoId/hqdefault.jpg');
  expect(video.uploadDate).toBe('2026-01-15');
});

test('e. route wiring: indexes, episode placeholder, sitemap lastmod', async ({ request }) => {
  // /podcast/ lists the shownotes fixture; the episode page renders with the
  // disabled placeholder and zero external media-domain strings.
  const podcastIndex = await (await request.get('/podcast/')).text();
  expect(podcastIndex).toContain('FIXTURE: Shownotes');
  expect(podcastIndex).toContain('/podcast/shownotes-fixture/');

  const episodeResponse = await request.get('/podcast/shownotes-fixture/');
  expect(episodeResponse.ok()).toBeTruthy();
  const episode = await episodeResponse.text();
  expect(episode).toContain('FIXTURE: Shownotes');
  expect(episode).toMatch(/<button\b[^>]*\bdisabled/);
  for (const host of MEDIA_HOSTS) {
    expect(episode).not.toContain(host);
  }

  // /videos/ lists the videos fixture; the video page renders.
  const videosIndex = await (await request.get('/videos/')).text();
  expect(videosIndex).toContain('FIXTURE: Video');
  expect(videosIndex).toContain('/videos/videos-fixture/');
  const videoResponse = await request.get('/videos/videos-fixture/');
  expect(videoResponse.ok()).toBeTruthy();

  // Both route families appear in the sitemap with <lastmod>. The sitemap
  // index lists absolute URLs on the canonical origin — rewrite them onto
  // the local preview server before fetching.
  const sitemapIndex = await (await request.get('/sitemap-index.xml')).text();
  const sitemapPaths = [...sitemapIndex.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => new URL(m[1]).pathname,
  );
  expect(sitemapPaths.length).toBeGreaterThan(0);
  let sitemapBody = '';
  for (const path of sitemapPaths) {
    sitemapBody += await (await request.get(path)).text();
  }
  for (const route of ['/podcast/', '/podcast/shownotes-fixture/', '/videos/', '/videos/videos-fixture/']) {
    const entry = sitemapBody.match(
      new RegExp(`<url>[\\s\\S]*?<loc>[^<]+${route.replace(/\//g, '\\/')}<\\/loc>[\\s\\S]*?<\\/url>`),
    );
    expect(entry, `sitemap entry for ${route}`).toBeTruthy();
    expect(entry![0]).toContain('<lastmod>');
  }
});
