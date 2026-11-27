// Generates the Valjubel "shattered glass" backgrounds (Jual / Beli quick-link cards and the
// Jual Beli panel), after the look of valforum.com/jual-beli-akun: deep purple, lighter towards the
// bottom right, diagonal light bands, translucent glass splinters with lavender edges, debris,
// straight cracks, and bold purple slashes at the edge. Drawn as SVG from a seeded random layout
// (same seed, same image), so they're still images: nothing animates.
// Run with `npm run backgrounds`. (The Sewa smoke images come from scripts/sewa-smoke.html.)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/assets/img');

// mirror: the glass gathers on the left instead of the right (the Jual Beli panel's copy is on the right).
const jobs = [
  { out: 'ql-jual-shards', seed: 7, width: 1600, height: 800 },
  { out: 'ql-beli-shards', seed: 42, width: 1600, height: 800 },
  { out: 'panel-jual-shards', seed: 7, width: 2400, height: 1500, mirror: true },
  { out: 'panel-jual-shards-tall', seed: 7, width: 1000, height: 2000, mirror: true },
];

function shardsSvg({ seed, width: W, height: H }) {
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const R = (a, b) => a + (b - a) * rnd();
  const K = Math.min(W, H) / 800; // shard size scale
  // The layout is designed on a 1600 × 800 canvas; X / Y map it onto the real size.
  const X = (v) => (v * W) / 1600;
  const Y = (v) => (v * H) / 800;

  // Where glass may go: mostly the right half and the edges, so the copy (left) stays calm.
  const weight = (x, y) => Math.min(1, 0.12 + 1.1 * Math.max(0, x / W - 0.38) + 0.35 * (y / H > 0.85 ? 1 : 0) + 0.3 * (x / W < 0.05 ? 1 : 0));

  // A splinter: 3–4 points around (cx, cy), one of them drawn out long.
  function shard(cx, cy, size) {
    const n = rnd() < 0.6 ? 3 : 4;
    const a0 = R(0, Math.PI * 2);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * Math.PI * 2 + R(-0.5, 0.5);
      const r = size * R(0.3, 0.9) * (i === 0 ? R(2.2, 4) : 1);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * R(0.25, 0.6)]);
    }
    return pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
  }

  let shards = '';
  let blurred = '';
  for (let i = 0; i < 170; i++) {
    const x = R(0, W);
    const y = R(0, H);
    if (rnd() > weight(x, y)) continue;
    const big = rnd() < 0.18;
    const size = (big ? R(60, 150) : R(12, 55)) * K;
    const fill = R(0.015, big ? 0.05 : 0.08);
    const edge = R(0.1, 0.42);
    const stroke = R(0.6, 1.4);
    const gradient = rnd() < 0.5 ? 'url(#glassA)' : 'url(#glassB)';
    const poly = `<polygon points="${shard(x, y, size)}" fill="${gradient}" fill-opacity="${(fill * 6).toFixed(2)}" stroke="rgb(214,190,255)" stroke-opacity="${edge.toFixed(2)}" stroke-width="${stroke.toFixed(2)}" stroke-linejoin="miter"/>`;
    if (rnd() < 0.3) blurred += poly; // out of focus
    else shards += poly;
  }

  let debris = '';
  for (let i = 0; i < 260; i++) {
    const x = R(0, W);
    const y = R(0, H);
    if (rnd() > weight(x, y)) continue;
    debris += `<polygon points="${shard(x, y, R(2, 7) * K)}" fill="rgb(220,200,255)" fill-opacity="${R(0.15, 0.5).toFixed(2)}"/>`;
  }

  // Straight cracks from two impact points on the right.
  let cracks = '';
  for (const [ix, iy] of [[X(R(1050, 1450)), Y(R(120, 380))], [X(R(900, 1300)), Y(R(520, 760))]]) {
    for (let k = 0; k < 9; k++) {
      let x = ix;
      let y = iy;
      let a = R(0, Math.PI * 2);
      let d = `M${x.toFixed(1)},${y.toFixed(1)}`;
      for (let j = 0; j < 3; j++) {
        a += R(-0.08, 0.08);
        const l = R(60, 170) * K;
        x += Math.cos(a) * l;
        y += Math.sin(a) * l;
        d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
      }
      cracks += `<path d="${d}" fill="none" stroke="rgb(225,205,255)" stroke-opacity="${R(0.08, 0.22).toFixed(2)}" stroke-width="${R(0.5, 1).toFixed(2)}"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
  <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#08030f"/><stop offset="0.55" stop-color="#1b0833"/><stop offset="1" stop-color="#3d1478"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.82" cy="0.95" r="0.75"><stop offset="0" stop-color="#8e30ff" stop-opacity="0.45"/><stop offset="1" stop-color="#8e30ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="glow2" cx="0.6" cy="0.15" r="0.5"><stop offset="0" stop-color="#6a22c8" stop-opacity="0.25"/><stop offset="1" stop-color="#6a22c8" stop-opacity="0"/></radialGradient>
  <linearGradient id="glassA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6d6ff"/><stop offset="1" stop-color="#7d3cff" stop-opacity="0.2"/></linearGradient>
  <linearGradient id="glassB" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9a8ff"/><stop offset="1" stop-color="#3a0f7a" stop-opacity="0.1"/></linearGradient>
  <linearGradient id="band" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#d9c2ff" stop-opacity="0.05"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="slash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a45cff" stop-opacity="0"/><stop offset="0.6" stop-color="#9b4dff" stop-opacity="0.55"/><stop offset="1" stop-color="#c79bff" stop-opacity="0.8"/></linearGradient>
  <filter id="soft"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="slashblur"><feGaussianBlur stdDeviation="1.2"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#base)"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
<rect width="${W}" height="${H}" fill="url(#glow2)"/>
<polygon points="${X(R(500, 700))},0 ${X(R(900, 1000))},0 ${X(R(500, 600))},${H} ${X(R(150, 300))},${H}" fill="url(#band)"/>
<polygon points="${X(R(1150, 1250))},0 ${X(R(1320, 1400))},0 ${X(R(1000, 1100))},${H} ${X(R(880, 960))},${H}" fill="url(#band)"/>
<polygon points="${W},${Y(R(80, 200))} ${W},${Y(R(420, 520))} ${W - R(150, 230) * K},${H}" fill="url(#slash)" filter="url(#slashblur)" opacity="0.9"/>
<polygon points="${W - R(40, 90) * K},${H} ${W},${Y(R(560, 650))} ${W},${H}" fill="#c79bff" opacity="0.35"/>
<g filter="url(#soft)">${blurred}</g>
${cracks}
${debris}
${shards}
</svg>`;
}

for (const job of jobs) {
  let img = sharp(await sharp(Buffer.from(shardsSvg(job))).png().toBuffer());
  if (job.mirror) img = img.flop();
  const info = await img.webp({ quality: 82, effort: 6 }).toFile(path.join(OUT, `${job.out}.webp`));
  console.log(`${job.out.padEnd(24)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`);
}
