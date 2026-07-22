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
  Organization | MortgageBroker | BreadcrumbList | ProfilePage | Person
>;

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
