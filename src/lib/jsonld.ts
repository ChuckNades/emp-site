// JSON-LD emitters, typed with schema-dts. All values come from facts.ts and
// the people content collection — empty [FILL] strings render as empty, never
// invented.
import type {
  Organization,
  MortgageBroker,
  BreadcrumbList,
  ListItem,
  ProfilePage,
  Person,
  Article,
  FAQPage,
  Question,
  VideoObject,
  Dataset,
  WithContext,
} from 'schema-dts';
import { getEntry } from 'astro:content';
import {
  legalName,
  nmls,
  nmlsConsumerAccessUrl,
  huntsvilleAddress,
  birminghamAddress,
  licensureStates,
} from '../data/facts';
import { SITE } from '../config/site';

export type JsonLd = WithContext<
  Organization | MortgageBroker | BreadcrumbList | ProfilePage | Person | Article | FAQPage | VideoObject | Dataset
>;

// Serialize JSON-LD for safe injection via set:html: every `<` is escaped as
// < so a value containing `</script>` can never break out of the
// script element. The escaped form is still valid JSON (JSON.parse handles
// unicode escapes). ALL JSON-LD script tags must use this helper.
export function serializeJsonLd(value: JsonLd | JsonLd[]): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function organizationJsonLd(): WithContext<Organization> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: legalName,
    url: SITE,
  };
}

export function mortgageBrokerJsonLd(): WithContext<MortgageBroker> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MortgageBroker',
    name: legalName,
    url: SITE,
    address: [huntsvilleAddress, birminghamAddress].filter((a) => a !== '').join('; '),
    areaServed: [...licensureStates],
  };
}

// Per-hub variant for the city hub pages: address comes from the hub's own
// facts field (empty-safe — an empty [FILL] renders as an empty string, never
// invented); areaServed is always exactly the licensure states.
export function hubMortgageBrokerJsonLd(address: string): WithContext<MortgageBroker> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MortgageBroker',
    name: legalName,
    url: SITE,
    address,
    areaServed: [...licensureStates],
  };
}

export interface BreadcrumbEntry {
  path: string;
  label: string;
}

export function breadcrumbJsonLd(items: BreadcrumbEntry[]): WithContext<BreadcrumbList> {
  const itemListElement: ListItem[] = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    item: new URL(item.path, SITE).href,
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

export async function personJsonLd(): Promise<WithContext<Person>> {
  const pete = await getEntry('people', 'pete');
  if (!pete) throw new Error("people collection entry 'pete' not found");
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: pete.data.name,
    jobTitle: pete.data.jobTitle,
    // NMLS identifier plus Consumer Access lookup URL (from facts.ts).
    identifier: nmls,
    sameAs: [...pete.data.sameAs, nmlsConsumerAccessUrl],
    image: pete.data.image,
  };
}

export async function profilePageJsonLd(path: string): Promise<WithContext<ProfilePage>> {
  const mainEntity = await personJsonLd();
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: new URL(path, SITE).href,
    mainEntity,
  };
}

export interface FaqPair {
  question: string;
  answer: string;
}

export interface ArticleInput {
  headline: string;
  datePublished: string;
  dateModified?: string;
  path: string;
}

// Article JSON-LD for cluster posts. dateModified falls back to datePublished
// when the entry carries no explicit modified date; author is always the
// people collection's pete entry.
export async function articleJsonLd(input: ArticleInput): Promise<WithContext<Article>> {
  const author = await personJsonLd();
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author,
    mainEntityOfPage: new URL(input.path, SITE).href,
  };
}

export interface VideoInput {
  name: string;
  description: string;
  youtubeId: string;
  datePublished: string;
}

// VideoObject JSON-LD for /videos/ pages. thumbnailUrl is a markup value
// (never a fetched asset); embedUrl is emitted instead of contentUrl so the
// page never references a direct media file.
export function videoJsonLd(input: VideoInput): WithContext<VideoObject> {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: input.name,
    description: input.description,
    thumbnailUrl: `https://i.ytimg.com/vi/${input.youtubeId}/hqdefault.jpg`,
    uploadDate: input.datePublished,
    embedUrl: `https://www.youtube-nocookie.com/embed/${input.youtubeId}`,
  };
}

// FAQPage JSON-LD from question/answer pairs — used both by cluster articles
// with embedded faq frontmatter and by the /faq/ hub (all non-draft entries).
export function faqPageJsonLd(faqs: FaqPair[]): WithContext<FAQPage> {
  const mainEntity: Question[] = faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}

export interface DatasetInput {
  name: string;
  description: string;
  path: string;
}

// Dataset JSON-LD for the market report page. creator is the Organization;
// distribution is omitted (the data is rendered inline as HTML tables, not
// offered as a downloadable file).
export function datasetJsonLd(input: DatasetInput): WithContext<Dataset> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: input.name,
    description: input.description,
    url: new URL(input.path, SITE).href,
    creator: organizationJsonLd(),
  };
}
