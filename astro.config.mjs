// @ts-check
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/config/site';
import { PAGE_DATES } from './src/config/page-dates';

// Read collection entries' frontmatter at config scope (astro:content's
// getCollection is not available here) so the sitemap serialize hook can
// resolve per-entry lastmod dates. Only the fields the hook needs are
// extracted: slug, draft, category (posts), dateModified, datePublished.
function frontmatterValue(/** @type {string} */ raw, /** @type {string} */ key) {
  const m = raw.match(new RegExp(`^${key}:\\s*"?([^"\\n]*)"?\\s*$`, 'm'));
  return m ? m[1] : undefined;
}

// Hub route prefixes by category key, kept in sync with src/config/hubs.ts
// HUB_PARAMS (this plain-.mjs config scope cannot import the TS map). Posts
// route under their owning hub: /<hub-param>/<slug>/.
const HUB_ROUTE_PREFIX = { learn: 'learn', partners: 'grow', originators: 'become' };

// Each entry carries its full expected pathname so the sitemap serialize hook
// can match routes EXACTLY (never by substring): posts resolve under their
// owning hub slug (category -> hub route prefix), shownotes/videos under
// their collection's route prefix (/podcast/ and /videos/).
const collectionEntries = ['posts', 'shownotes', 'videos'].flatMap((name) =>
  globSync(`src/content/${name}/**/*.{md,mdx}`).map((file) => {
    const raw = readFileSync(file, 'utf8');
    const slug = frontmatterValue(raw, 'slug');
    let pathname;
    if (name === 'posts') {
      const category = frontmatterValue(raw, 'category');
      const hub = category ? HUB_ROUTE_PREFIX[category] : undefined;
      pathname = slug && hub ? `/${hub}/${slug}/` : undefined;
    } else {
      const prefix = name === 'shownotes' ? 'podcast' : 'videos';
      pathname = slug ? `/${prefix}/${slug}/` : undefined;
    }
    return {
      pathname,
      draft: frontmatterValue(raw, 'draft') === 'true',
      dateModified: frontmatterValue(raw, 'dateModified'),
      datePublished: frontmatterValue(raw, 'datePublished'),
    };
  }),
);

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: SITE,
  // T15a: emit the brand mark SVG as a real hashed file instead of an inlined
  // data: URI (Vite's default assetsInlineLimit would inline the small SVG,
  // which the T8 gate bans and which hides the emp-mark asset reference).
  // Other assets keep the default inline behavior (the MediaFacade script
  // must stay inlined — T9 bans <script src> in initial HTML).
  vite: {
    build: {
      assetsInlineLimit: (filePath) =>
        filePath.endsWith('.svg') ? false : undefined,
    },
  },
  integrations: [
    mdx(),
    sitemap({
      serialize: async (item) => {
        const path = new URL(item.url).pathname;
        // Static/core pages: per-page date from the page-dates map.
        if (PAGE_DATES[path]) {
          item.lastmod = PAGE_DATES[path];
          return item;
        }
        // Collection-driven pages: exact pathname match against each entry's
        // precomputed route, using its dateModified (falling back to
        // datePublished). Substring matching is banned — overlapping slugs
        // (e.g. `alpha` vs `alpha-two`) must each carry their OWN date.
        const entry = collectionEntries.find(
          (e) => !e.draft && e.pathname && e.pathname === path,
        );
        if (entry) {
          item.lastmod = entry.dateModified ?? entry.datePublished;
        }
        return item;
      },
    }),
  ],
});
