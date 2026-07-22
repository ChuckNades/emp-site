// Single source of truth mapping category keys to hub slugs and labels.
// No other file may hardcode hub slugs, ever.

export const HUB_CATEGORIES = ['learn', 'partners', 'originators'] as const;

export type HubCategory = (typeof HUB_CATEGORIES)[number];

export const HUB_SLUGS = {
  learn: '/learn/',
  partners: '/grow/',
  originators: '/become/',
} as const satisfies Record<HubCategory, string>;

// Neutral hub labels rendered as each hub page's H1.
export const HUB_LABELS = {
  learn: 'Learn',
  partners: 'Grow',
  originators: 'Become',
} as const satisfies Record<HubCategory, string>;

// Route param (bare slug, no slashes) for each hub, derived from HUB_SLUGS.
export const HUB_PARAMS = Object.fromEntries(
  HUB_CATEGORIES.map((category) => [category, HUB_SLUGS[category].replaceAll('/', '')]),
) as Record<HubCategory, string>;

// Look up the hub category for a route param; undefined when the param is not
// a hub route (used by the [hub]/[slug] article route to reject non-hub params).
export function hubCategoryForParam(param: string): HubCategory | undefined {
  return HUB_CATEGORIES.find((category) => HUB_PARAMS[category] === param);
}
