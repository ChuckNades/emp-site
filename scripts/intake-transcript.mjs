#!/usr/bin/env node
// T12: dictate→MDX intake. Moves a raw transcript into src/content/posts/ as a
// schema-valid, ALWAYS-draft MDX file. The tool is transport, not authoring:
// sentences are carried VERBATIM into the body — no summarization, no
// rewriting, no added copy. Pete edits afterward.
//
// Usage: npm run intake -- <transcript-path> [--category learn|partners|originators]
//
// Pinned rules:
// - title: `FIXTURE: ` + first-line stub when the first line carries the
//   FIXTURE prefix; otherwise the first line verbatim (working title).
//   Stub = first line minus the FIXTURE prefix, truncated at 80 chars.
// - description: first SENTENCE trimmed to ≤160 chars.
// - slug: kebab of the title — lowercase, non-alphanumerics → single hyphens,
//   trimmed, max 60 chars — deduped with a numeric suffix (-2, -3, …) when
//   the target file already exists.
// - datePublished: today (ISO date). author: pete. category: flag (default
//   learn). draft: true ALWAYS.
// - body: the transcript sentences as blank-line-separated paragraphs.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const POSTS_DIR = 'src/content/posts';
const CATEGORIES = ['learn', 'partners', 'originators'];

function fail(msg) {
  console.error(`intake: ${msg}`);
  process.exit(1);
}

// --- args -----------------------------------------------------------------
const args = process.argv.slice(2);
let transcriptPath;
let category = 'learn';
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--category') {
    category = args[i + 1] ?? '';
    i += 1;
  } else if (!transcriptPath) {
    transcriptPath = args[i];
  } else {
    fail(`unexpected argument: ${args[i]}`);
  }
}
if (!transcriptPath) fail('usage: npm run intake -- <transcript-path> [--category learn|partners|originators]');
if (!CATEGORIES.includes(category)) fail(`--category must be one of ${CATEGORIES.join('|')} (got "${category}")`);
if (!existsSync(transcriptPath)) fail(`transcript not found: ${transcriptPath}`);

// --- read + sentence split -------------------------------------------------
const raw = readFileSync(transcriptPath, 'utf8');
const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
if (lines.length === 0) fail('transcript is empty');
const firstLine = lines[0];

// Sentences: split on ., !, ? followed by whitespace or end. Trailing
// fragments without terminal punctuation still count as a sentence.
const body = lines.slice(1).join(' ');
const sentences = (body.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) ?? [])
  .map((s) => s.trim())
  .filter((s) => s.length > 0);
if (sentences.length === 0) fail('transcript has no body sentences (needs content after the first line)');

// --- frontmatter fields ----------------------------------------------------
const FIXTURE_PREFIX = 'FIXTURE ';
const isFixture = firstLine.startsWith(FIXTURE_PREFIX);
const titleStub = (isFixture ? firstLine.slice(FIXTURE_PREFIX.length) : firstLine)
  .trim()
  .slice(0, 80)
  .trim();
const title = isFixture ? `FIXTURE: ${titleStub}` : titleStub;

const description = sentences[0].length > 160 ? sentences[0].slice(0, 160).trim() : sentences[0];

// Slug normalization (pinned): lowercase, non-alphanumerics → single hyphens,
// trim hyphens, max 60 chars (never cut mid-run of hyphens).
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}
const baseSlug = slugify(title);
if (!baseSlug) fail('title produced an empty slug');

mkdirSync(POSTS_DIR, { recursive: true });
let slug = baseSlug;
for (let n = 2; existsSync(path.join(POSTS_DIR, `${slug}.mdx`)); n += 1) {
  slug = `${baseSlug}-${n}`;
}

const datePublished = new Date().toISOString().slice(0, 10);

// --- emit ------------------------------------------------------------------
// Quote frontmatter scalars the same way the existing fixtures do; escape any
// embedded double quotes so the YAML stays valid for arbitrary transcripts.
const q = (s) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const frontmatter = [
  '---',
  `title: ${q(title)}`,
  `description: ${q(description)}`,
  `slug: ${q(slug)}`,
  `datePublished: ${q(datePublished)}`,
  'author: pete',
  `category: ${category}`,
  'draft: true',
  '---',
].join('\n');

const mdx = `${frontmatter}\n\n${sentences.join('\n\n')}\n`;
const outPath = path.join(POSTS_DIR, `${slug}.mdx`);
writeFileSync(outPath, mdx);
console.log(`intake: wrote ${outPath} (title: ${q(title)}, category: ${category}, draft: true)`);
