// Single source of truth mapping category keys to hub slugs.
// No other file may hardcode hub slugs, ever.

export const HUB_CATEGORIES = ['learn', 'partners', 'originators'] as const;

export type HubCategory = (typeof HUB_CATEGORIES)[number];

export const HUB_SLUGS = {
  learn: '/learn/',
  partners: '/grow/',
  originators: '/become/',
} as const satisfies Record<HubCategory, string>;
