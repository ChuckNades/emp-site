// Per-page lastmod dates for static/core routes, keyed by route path.
// The sitemap serialize hook reads this map; each route carries its own date.
// Hub routes are keyed by HUB_SLUGS — hubs.ts is the only place slugs exist.
import { HUB_SLUGS } from './hubs';

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
  [HUB_SLUGS.learn]: '2026-07-22',
  [HUB_SLUGS.partners]: '2026-07-22',
  [HUB_SLUGS.originators]: '2026-07-22',
  '/faq/': '2026-07-22',
  '/podcast/': '2026-07-22',
  '/videos/': '2026-07-22',
};
