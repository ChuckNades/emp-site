import { defineCollection, reference, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { HUB_CATEGORIES } from './config/hubs';

const categoryEnum = z.enum(HUB_CATEGORIES);

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      slug: z.string(),
      datePublished: z.string().date(),
      dateModified: z.string().date().optional(),
      author: reference('people'),
      category: categoryEnum,
      alsoRelevantTo: z.array(categoryEnum).optional(),
      tags: z.array(z.string()).optional(),
      image: z.string().optional(),
      faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
      draft: z.boolean().default(false),
    }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/faqs' }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
  }),
});

const shownotes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/shownotes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    datePublished: z.string().date(),
    dateModified: z.string().date().optional(),
    episodeNumber: z.number(),
    youtubeId: z.string().optional(),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const videos = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/videos' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    datePublished: z.string().date(),
    youtubeId: z.string(),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const people = defineCollection({
  loader: file('src/content/people.json'),
  schema: z.object({
    name: z.string(),
    jobTitle: z.string(),
    nmls: z.string(),
    sameAs: z.array(z.string().url()),
    image: z.string(),
  }),
});

export const collections = { posts, faqs, shownotes, videos, people };
