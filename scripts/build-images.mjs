// Converts the design hand-off assets into the optimized WebP files the site uses.
// Run with `npm run images` whenever an asset in "Valforum Design Assets" changes.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.resolve(root, '../Valforum Design Assets');
const OUT = path.resolve(root, 'src/assets/img');

// Gold grade measured from the design: the grayscale "Split" map is multiplied by a
// warm gold whose strength rises from the top-left corner towards the bottom-right.
// k(x, y) is a cubic fit (x, y normalised 0..1) of that multiplier.
const HERO_GRADE = {
  terms: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [3, 0]],
  coef: [0.0959, -0.3508, 0.9939, -0.6076, -0.6403, 2.5581, -1.0545, 2.2442, -1.5043, -1.3331],
  rgb: [1, 0.845, 0.35],
};

const jobs = [
  // Hero. `retina` jobs read a 4x master from 4x/ and also write a <name>-2x file for srcset;
  // `width` is the 1x width in design pixels.
  { src: '4x/Split.png', out: 'hero-bg', width: 1329, retina: true, quality: 78, transform: gradeHero },
  { src: '4x/Phoenix_artwork.png', out: 'hero-phoenix', width: 534, retina: true },
  { src: '4x/Jett_artwork.png', out: 'hero-jett', width: 704, retina: true },
  { src: '4x/ChatGPT Image May 29 2026 Design Request 3.png', out: 'hero-badge', width: 523, retina: true },

  // Brand marks
  { src: 'Frame 2147223229.png', out: 'favicon', format: 'png', extract: { left: 576, top: 272, width: 100, height: 75 }, transform: favicon },
  { src: '4x/Transparent Background Request Jun 16 2026 1.png', out: 'wa-community', width: 441, retina: true, quality: 90 },

  // Partner logos (Top Up section)
  { src: '4x/Group 1261153003.png', out: 'partner-valorant', width: 69, retina: true, lossless: true, trim: true },
  { src: '4x/Mask group.png', out: 'partner-mlbb', width: 59, retina: true, lossless: true, trim: true },
  { src: '4x/Mask group-1.png', out: 'partner-genshin', width: 67, retina: true, lossless: true, trim: true },
  { src: '4x/Mask group-2.png', out: 'partner-pointblank', width: 41, retina: true, lossless: true, trim: true },

  // Quick-link cards
  { src: '4x/image 95-1.png', out: 'ql-vp-1000', width: 291, retina: true },
  { src: '4x/image 94-1.png', out: 'ql-vp-475', width: 360, retina: true },
  { src: '4x/image 96-1.png', out: 'ql-vp-2050', width: 188, retina: true },
  { src: '4x/image 98.png', out: 'ql-gun-vandal', width: 330, retina: true },
  { src: '4x/image 99.png', out: 'ql-gun-spectre', width: 138, retina: true },
  { src: '4x/image 102.png', out: 'ql-gun-operator', width: 255, retina: true },
  { src: '4x/image 100.png', out: 'ql-gun-odin', width: 199, retina: true },
  { src: '4x/Screenshot 2026-06-03 at 16.38.02 1-1.png', out: 'ql-acc-gold', width: 181, retina: true, quality: 90 },
  { src: '4x/Screenshot 2026-06-03 at 16.37.42 1-1.png', out: 'ql-acc-platinum', width: 181, retina: true, quality: 90 },
  { src: '4x/Screenshot 2026-06-03 at 16.51.23 1-1.png', out: 'ql-acc-diamond', width: 170, retina: true, quality: 90 },

  // Sewa
  { src: '4x/IMG_1512 1.png', out: 'sewa-neon', width: 901, retina: true },
  { src: '4x/Frame 2147223231.png', out: 'sewa-acc-1', width: 285, retina: true, quality: 90 },
  { src: '4x/Frame 33574.png', out: 'sewa-acc-2', width: 285, retina: true, quality: 90 },
  { src: '4x/Frame 33501.png', out: 'sewa-acc-3', width: 285, retina: true, quality: 90 },
  // Screenshot with a black margin: cut out along its frame, squeezed <1% to the other cards' 285 × 233.
  { src: 'Sewa account SSS-6.png', out: 'sewa-acc-4', extract: { left: 7, top: 12, width: 916, height: 755 }, card: {}, width: 285, height: 233, retina: true, quality: 90 },

  // Jual / Beli
  { src: 'Cypher_ingame_hd.png', out: 'jual-cypher', trim: true, width: 560 },
  // Official full portrait (valorant-api.com), cropped to the design's framing; 624px is all the detail there is.
  { src: 'Gekko_fullportrait.png', out: 'beli-gekko', extract: { left: 702, top: 228, width: 624, height: 794 }, width: 620 },

  // Beli account cards (portrait, used by the Beli quick link). Some screenshots stop just under the
  // listing panel and others carry a price row, so every card is cut 34px around the panel and closed below it.
  { src: 'Beli account VAL-5697.png', out: 'beli-acc-2', extract: { left: 11, top: 13, width: 747, height: 994 }, card: { padBottom: 34 }, width: 230, retina: true, quality: 90 },
  { src: 'Beli account VAL-5775.png', out: 'beli-acc-3', extract: { left: 11, top: 14, width: 747, height: 994 }, card: { padBottom: 34 }, width: 230, retina: true, quality: 90 },
  { src: 'Beli account VAL-1968.png', out: 'beli-acc-4', extract: { left: 12, top: 12, width: 747, height: 994 }, card: { padBottom: 34 }, width: 230, retina: true, quality: 90 },

  // Beli panel row: the same cards cut down to the header and inventory screenshot, then fitted
  // (~6% squeeze) to the Sewa cards' 285 × 233 so every row uses one card shape.
  { src: 'Beli account VAL-5697.png', out: 'beli-row-1', extract: { left: 11, top: 13, width: 747, height: 636 }, card: { padBottom: 14 }, width: 285, height: 233, retina: true, quality: 90 },
  { src: 'Beli account VAL-5775.png', out: 'beli-row-2', extract: { left: 11, top: 14, width: 747, height: 636 }, card: { padBottom: 14 }, width: 285, height: 233, retina: true, quality: 90 },
  { src: 'Beli account VAL-1968.png', out: 'beli-row-3', extract: { left: 12, top: 12, width: 747, height: 636 }, card: { padBottom: 14 }, width: 285, height: 233, retina: true, quality: 90 },
  { src: 'Beli account VAL-5747.png', out: 'beli-row-4', extract: { left: 9, top: 14, width: 747, height: 636 }, card: { padBottom: 14 }, width: 285, height: 233, retina: true, quality: 90 },

  // Top Up game cards
  { src: '4x/Frame 2147223256.png', out: 'game-pointblank', width: 270, retina: true },
  { src: '4x/Frame 2147223217.png', out: 'game-mlbb', width: 269, retina: true },
  { src: '4x/Frame 2147223216.png', out: 'game-valorant', width: 258, retina: true },
  { src: '4x/Frame 2147223257.png', out: 'game-genshin', width: 274, retina: true },
  { src: '4x/Frame 2147223258.png', out: 'game-pubg', width: 265, retina: true },
];

async function gradeHero(img) {
  const { data, info } = await img.removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    const Y = y / h;
    for (let x = 0; x < w; x++) {
      const X = x / w;
      let k = 0;
      HERO_GRADE.terms.forEach(([i, j], n) => { k += HERO_GRADE.coef[n] * X ** i * Y ** j; });
      k = Math.min(0.85, Math.max(0.03, k));
      const g = data[y * w + x];
      for (let c = 0; c < 3; c++) out[(y * w + x) * 3 + c] = Math.round(g * k * HERO_GRADE.rgb[c]);
    }
  }
  return sharp(out, { raw: { width: w, height: h, channels: 3 } });
}

// Account screenshots: redraws the card's 2px frame (grey at top and bottom, fading to black at
// mid-height, as in the originals) on the crop edge after padding the bottom, so a card trimmed
// under its listing panel closes cleanly. Corners outside the frame become transparent.
async function cardFrame(img, { padBottom = 0 }) {
  const { data, info } = await img
    .extend({ bottom: padBottom, background: '#000' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const frame = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="#666"/><stop offset=".5" stop-color="#000"/><stop offset="1" stop-color="#666"/></linearGradient>
    <rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="7" fill="none" stroke="#000" stroke-width="6"/>
    <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="9" fill="none" stroke="url(#g)" stroke-width="2"/>
  </svg>`;
  const mask = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="10"/></svg>`;
  // Flattened to a buffer so the later resize can't run before the composite.
  const out = await sharp(data, { raw: info })
    .composite([{ input: Buffer.from(frame) }, { input: Buffer.from(mask), blend: 'dest-in' }])
    .png()
    .toBuffer();
  return sharp(out);
}

// Lifts a gold mark off the footer export's near-black backdrop.
async function blackToAlpha(img) {
  const { data, info } = await img.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const out = Buffer.alloc(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    const r = data[p * 3], g = data[p * 3 + 1], b = data[p * 3 + 2];
    const a = Math.min(1, Math.max(0, (Math.max(r, g, b) - 30) / 40));
    out.set([r, g, b, Math.round(a * 255)], p * 4);
  }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } });
}

// The "V" emblem from the large logo, centred on a square transparent canvas.
async function favicon(img) {
  const emblem = await (await blackToAlpha(img)).png().toBuffer();
  const trimmed = await sharp(emblem).trim({ threshold: 1 }).toBuffer();
  return sharp(trimmed)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
}

await mkdir(OUT, { recursive: true });
for (const job of jobs) {
  for (const scale of job.retina ? [1, 2] : [1]) {
    const name = scale === 1 ? job.out : `${job.out}-${scale}x`;
    let img = sharp(path.join(SRC, job.src));
    if (job.extract) img = img.extract(job.extract);
    if (job.trim) img = img.trim({ threshold: 1 });
    if (job.card) img = await cardFrame(img, job.card);
    if (job.width) img = img.resize(job.height ? { width: job.width * scale, height: job.height * scale, fit: 'fill' } : { width: job.width * scale });
    if (job.transform) img = await job.transform(img);
    const format = job.format ?? 'webp';
    const file = path.join(OUT, `${name}.${format}`);
    if (format === 'png') img = img.png({ compressionLevel: 9 });
    else img = img.webp(job.lossless ? { lossless: true } : { quality: job.quality ?? 82, alphaQuality: 90, effort: 6 });
    const info = await img.toFile(file);
    console.log(`${name.padEnd(20)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`);
  }
}
