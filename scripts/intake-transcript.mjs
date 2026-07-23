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
// - datePublished: today (LOCAL calendar date, y-m-d). author: pete. category:
//   flag (default learn). draft: true ALWAYS.
// - body: the transcript sentences as blank-line-separated paragraphs.
//   Sentences come from Intl.Segmenter (locale-aware: "Dr. Smith", "3.5
//   percent", and ellipses stay intact); blank lines in the transcript are
//   the ONLY paragraph boundaries — sentences never reflow across them.
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

// Paragraphs: blank lines in the transcript are the ONLY paragraph
// boundaries — sentences never reflow across them. Each non-blank run of
// lines is one paragraph; within it, Intl.Segmenter (locale-aware, so
// decimals like "3.5" and ellipses stay intact) yields the sentences.
// ICU still breaks after an abbreviation before an uppercase word ("Dr.
// Smith"), so segments ending in a common abbreviation are rejoined with
// the next segment — dictated names must survive verbatim. Trailing
// fragments without terminal punctuation still count as a sentence.
const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
const ABBREV = /(?:^|\s)(?:Dr|Mr|Mrs|Ms|St|Jr|Sr|Prof|Gov|Sen|Rep|Gen|Col|Capt|Lt|Sgt|vs|etc|e\.g|i\.e)\.$/;
function sentencesOf(paragraph) {
  const out = [];
  for (const { segment } of segmenter.segment(paragraph)) {
    if (out.length > 0 && ABBREV.test(out[out.length - 1].trimEnd())) {
      out[out.length - 1] += segment;
    } else {
      out.push(segment);
    }
  }
  return out.map((s) => s.trim()).filter((s) => s.length > 0);
}
const rawLines = raw.split('\n');
// The title is the first non-blank line; the body is everything after it.
const firstLineIdx = rawLines.findIndex((l) => l.trim().length > 0);
const paragraphs = [];
let current = [];
for (const rawLine of rawLines.slice(firstLineIdx + 1)) {
  const trimmed = rawLine.trim();
  if (trimmed.length === 0) {
    if (current.length > 0) {
      paragraphs.push(current.join(' '));
      current = [];
    }
  } else {
    current.push(trimmed);
  }
}
if (current.length > 0) paragraphs.push(current.join(' '));

const sentences = paragraphs.flatMap(sentencesOf);
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

// datePublished: the LOCAL calendar date (sv-SE gives y-m-d), not the UTC
// ISO slice — a late-evening dictation must not be dated tomorrow.
const datePublished = new Intl.DateTimeFormat('sv-SE').format(new Date());

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
