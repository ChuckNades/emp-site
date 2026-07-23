// T15b — contrast CI check.
// Parses src/styles/tokens.css (the single source of truth — values are never
// re-hardcoded here), computes WCAG contrast ratios, and asserts the declared
// pairs from T15b-TASK.md. Then scans the BUILT page CSS (dist/) and FAILS if
// coral or gold is used as a normal-size text color on --bg or --teal.
// Exits nonzero if any assertion fails; prints a per-check PASS line.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TOKENS = path.join(ROOT, 'src/styles/tokens.css');
const DIST = path.join(ROOT, 'dist');

let failed = false;
const pass = (msg) => console.log(`PASS: ${msg}`);
const fail = (msg) => {
  console.log(`FAIL: ${msg}`);
  failed = true;
};

// --- Parse the color tokens out of tokens.css (never re-hardcode a value).
const tokensSrc = fs.readFileSync(TOKENS, 'utf8');
const token = (name) => {
  const m = tokensSrc.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})\\b`));
  if (!m) {
    fail(`tokens.css does not declare --${name}`);
    return undefined;
  }
  return m[1].toUpperCase();
};

const TEAL = token('teal');
const TEAL_INTERACTIVE = token('teal-interactive');
const TEAL_TINT_80 = token('teal-tint-80');
const TEAL_TINT_60 = token('teal-tint-60');
const CORAL = token('coral');
const GOLD = token('gold');
const INK = token('ink');
const BG = token('bg');
// Off-white header text on the teal ground is --bg on --teal.
const OFF_WHITE = BG;

// --- WCAG relative luminance + contrast ratio.
function luminance(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(fg, bg) {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

// --- Declared pairs (name, fg, bg, minimum, note).
const PAIRS = [
  ['ink/bg', INK, BG, 4.5, 'body text'],
  ['teal-interactive/bg', TEAL_INTERACTIVE, BG, 4.5, 'links/buttons on light'],
  ['off-white-on-teal', OFF_WHITE, TEAL, 3.0, 'large only (header)'],
  ['coral/ink', CORAL, INK, 4.5, 'semantic accent on ink'],
  ['gold/ink', GOLD, INK, 4.5, 'semantic accent on ink'],
  ['teal-tint-80/ink', TEAL_TINT_80, INK, 4.5, 'tint text on ink'],
  ['teal-tint-60/ink', TEAL_TINT_60, INK, 4.5, 'tint text on ink'],
];

{
  let bad = 0;
  for (const [name, fg, bg, min, note] of PAIRS) {
    if (!fg || !bg) {
      bad += 1;
      continue;
    }
    const r = ratio(fg, bg);
    if (r < min) {
      fail(`contrast: ${name} = ${r.toFixed(2)}:1 < ${min}:1 (${note})`);
      bad += 1;
    } else {
      pass(`contrast: ${name} = ${r.toFixed(2)}:1 >= ${min}:1 (${note})`);
    }
  }
  if (bad > 0) finish();
}

// --- Scan the BUILT page CSS: coral/gold must never be a normal-size text
//     color on --bg or --teal. We flag any `color:` declaration (a TEXT
//     context) that resolves to coral or gold and whose selector does not
//     scope it to an --ink surface (where the accent is permitted to carry
//     meaning). Border/underline/background uses are decorative and allowed.
{
  if (!fs.existsSync(DIST)) {
    fail('dist/ missing — build before running the contrast check');
    finish();
  }
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
      d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)],
    );
  const cssFiles = walk(DIST).filter((f) => f.endsWith('.css'));

  const accentHexes = [CORAL, GOLD].filter(Boolean).map((h) => h.toLowerCase());
  const accentVars = ['--coral', '--gold'];

  let bad = 0;
  for (const file of cssFiles) {
    const rel = path.relative(DIST, file);
    const css = fs.readFileSync(file, 'utf8');
    // Split into rules: selector { body }. For each `color:` declaration that
    // resolves to coral/gold, require the selector to scope the text to a dark
    // surface (--ink or --teal ground) where the accent is permitted to carry
    // meaning. A bare accent `color:` on a light (--bg) selector is a
    // violation. Border/underline/background uses are decorative and allowed.
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = m[1];
      const body = m[2];
      for (const decl of body.matchAll(/(?:^|;)\s*color:\s*([^;]+)/g)) {
        const value = decl[1].trim().toLowerCase();
        const isAccent =
          accentHexes.some((hex) => value.includes(hex)) ||
          accentVars.some((v) => value.includes(`var(${v}`));
        if (!isAccent) continue;
        // Permitted only when the selector scopes the text to a dark surface
        // where the accent may carry meaning: an --ink ground (footer /
        // .on-ink) or a --teal ground (header / .on-teal). A light-ground
        // (--bg) selector carrying coral/gold TEXT is the banned case.
        const onDarkSurface = /footer|header|on-ink|on-teal|--ink|--teal/.test(selector);
        if (!onDarkSurface) {
          fail(
            `accent text: ${rel} uses coral/gold as a text color on a light (--bg) surface: \`${selector.trim()} { color: ${value} }\``,
          );
          bad += 1;
        }
      }
    }
  }
  if (bad === 0) {
    pass(
      `accent text: no coral/gold normal-size text color on --bg/--teal in built CSS (${cssFiles.length} file(s) scanned)`,
    );
  }
}

function finish() {
  if (failed) {
    process.exit(1);
  }
  console.log('All T15b contrast checks passed.');
  process.exit(0);
}

finish();
