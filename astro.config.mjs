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
// extracted: slug, draft, dateModified, datePublished.
function frontmatterValue(/** @type {string} */ raw, /** @type {string} */ key) {
  const m = raw.match(new RegExp(`^${key}:\\s*"?([^"\\n]*)"?\\s*$`, 'm'));
  return m ? m[1] : undefined;
}

const collectionEntries = ['posts', 'shownotes', 'videos'].flatMap((name) =>
  globSync(`src/content/${name}/**/*.{md,mdx}`).map((file) => {
    const raw = readFileSync(file, 'utf8');
    return {
      slug: frontmatterValue(raw, 'slug'),
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
        // Collection-driven pages: match the entry by its slug, using its
        // dateModified (falling back to datePublished).
        const entry = collectionEntries.find(
          (e) => !e.draft && e.slug && path.includes(e.slug),
        );
        if (entry) {
          item.lastmod = entry.dateModified ?? entry.datePublished;
        }
        return item;
      },
    }),
  ],
});
