// T15a — one-time brand asset generation (outputs are COMMITTED to public/).
// Derives the favicon PNGs from the ratified small mark and the default OG
// image from the ratified primary mark. The SVGs in src/assets/brand/ are
// locked assets — this script consumes them, never modifies them. Re-run
// only if the ratified assets change: `node scripts/gen-favicons.mjs`.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BRAND = path.join(ROOT, 'src/assets/brand');
const PUBLIC = path.join(ROOT, 'public');

// favicon.svg is a verbatim copy of the ratified small mark.
fs.copyFileSync(path.join(BRAND, 'emp-mark-small.svg'), path.join(PUBLIC, 'favicon.svg'));

// Raster PNG favicons derived from the small mark. High density so the
// vector rasterizes crisply at these small sizes.
for (const [size, name] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png']]) {
  await sharp(path.join(BRAND, 'emp-mark-small.svg'), { density: 300 })
    .resize(size, size)
    .png()
    .toFile(path.join(PUBLIC, name));
}

// Default OG image: ratified primary mark centered on the ratified off-white
// brand ground #FAF7F2 at the standard 1200x630.
const OG_W = 1200;
const OG_H = 630;
const MARK = 400;
const mark = await sharp(path.join(BRAND, 'emp-mark.svg'), { density: 300 })
  .resize(MARK, MARK)
  .png()
  .toBuffer();
await sharp({
  create: { width: OG_W, height: OG_H, channels: 3, background: '#FAF7F2' },
})
  .composite([{ input: mark, left: (OG_W - MARK) / 2, top: (OG_H - MARK) / 2 }])
  .png()
  .toFile(path.join(PUBLIC, 'og-default.png'));

for (const name of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'og-default.png']) {
  const { size } = fs.statSync(path.join(PUBLIC, name));
  console.log(`generated public/${name} (${size} bytes)`);
}
