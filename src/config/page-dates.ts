// Per-page lastmod dates for static/core routes, keyed by route path.
// The sitemap serialize hook reads this map; each route carries its own date.
export const PAGE_DATES: Record<string, string> = {
  '/': '2026-07-22',
  '/about/': '2026-07-22',
  '/results/': '2026-07-22',
  '/contact/': '2026-07-22',
  '/huntsville/': '2026-07-22',
  '/birmingham/': '2026-07-22',
  '/alabama/': '2026-07-22',
  '/tennessee/': '2026-07-22',
  '/mississippi/': '2026-07-22',
};
