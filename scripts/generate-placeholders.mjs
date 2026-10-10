// Generates tasteful local SVG placeholder images for BABLI products.
// Run: node scripts/generate-placeholders.mjs
// No external images are hotlinked — everything is generated locally.
// Two images per product (second = hover/alternate view).
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../public/images/products");
mkdirSync(OUT, { recursive: true });

// Garment silhouettes (viewBox 0 0 600 800)
const ART = {
  suit: `<path d="M230,180 L150,235 L188,305 L226,288 L226,680 L374,680 L374,288 L412,305 L450,235 L370,180 C345,210 325,218 300,218 C275,218 255,210 230,180 Z"/>
          <path d="M255,300 Q300,320 345,300" stroke="#000" stroke-opacity="0.15" stroke-width="5" fill="none"/>
          <path d="M250,420 Q300,445 350,420 M245,540 Q300,565 355,540" stroke="#000" stroke-opacity="0.12" stroke-width="5" fill="none"/>
          <circle cx="300" cy="262" r="5" fill="#000" opacity="0.18"/><circle cx="300" cy="296" r="5" fill="#000" opacity="0.18"/>`,
  kurta: `<path d="M235,175 L160,230 L195,300 L230,285 L230,660 L370,660 L370,285 L405,300 L440,230 L365,175 C342,205 322,213 300,213 C278,213 258,205 235,175 Z"/>
          <path d="M300,213 L300,340" stroke="#000" stroke-opacity="0.15" stroke-width="6"/>
          <path d="M250,480 Q300,500 350,480" stroke="#000" stroke-opacity="0.12" stroke-width="5" fill="none"/>`,
  shawl: `<path d="M170,240 Q300,200 430,240 L400,640 Q300,610 200,640 Z"/>
          <path d="M190,300 Q300,265 410,300 M185,380 Q300,345 415,380 M180,460 Q300,425 420,460 M175,540 Q300,505 425,540" stroke="#000" stroke-opacity="0.14" stroke-width="6" fill="none"/>
          <path d="M170,240 Q300,200 430,240" stroke="#000" stroke-opacity="0.2" stroke-width="6" fill="none"/>`,
};

const PRODUCTS = [
  ["embroidered-lawn-3pc-rose", "Embroidered Lawn 3 PCS", "suit", "#fdf2f8", "#f9a8d4", "#be185d"],
  ["luxury-chiffon-3pc-emerald", "Embellished Chiffon 3 PCS", "suit", "#ecfdf5", "#6ee7b7", "#047857"],
  ["karandi-3pc-maroon", "Cotton Karandi 3 PCS", "suit", "#fef2f2", "#fca5a5", "#991b1b"],
  ["printed-cambric-2pc-sky", "Printed Cambric 2 PCS", "suit", "#f0f9ff", "#7dd3fc", "#0369a1"],
  ["khaddar-pret-mustard", "Pret Khaddar 3 PCS", "kurta", "#fffbeb", "#fcd34d", "#92400e"],
  ["printed-lawn-kurti-coral", "Printed Lawn Kurti", "kurta", "#fff7ed", "#fdba74", "#c2410c"],
  ["shamoz-silk-pret-teal", "Shamoz Silk Shirt", "kurta", "#f0fdfa", "#5eead4", "#0f766e"],
  ["pashmina-shawl-beige", "Pashmina Shawl", "shawl", "#fafaf9", "#e7e5e4", "#78716c"],
  ["wool-stoler-charcoal", "Wool Stoler", "shawl", "#f5f5f4", "#a8a29e", "#44403c"],
  ["embroidered-lawn-2pc-lavender", "Embroidered Lawn 2 PCS", "suit", "#faf5ff", "#d8b4fe", "#7e22ce"],
  ["luxury-lawn-3pc-gold", "Luxury Lawn 3 PCS", "suit", "#fffbeb", "#fde68a", "#b45309"],
  ["karandi-pret-olive", "Pret Karandi 2 PCS", "kurta", "#f7fee7", "#bef264", "#4d7c0f"],
  ["festive-chiffon-3pc-blush", "Festive Chiffon 3 PCS", "suit", "#fdf2f8", "#fbcfe8", "#9d174d"],
  ["printed-khaddar-2pc-rust", "Printed Khaddar 2 PCS", "suit", "#fff7ed", "#fed7aa", "#9a3412"],
];

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

function makeSvg(name, art, bg, garment, deep, variant) {
  // variant 0 = front view, 1 = alternate (zoomed detail feel)
  const inner = variant === 1 ? `<g transform="translate(-120,-100) scale(1.35)">` : `<g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" role="img" aria-label="${esc(name)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="1" stop-color="${deep}" stop-opacity="0.22"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.42" r="0.42">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="600" height="800" fill="url(#bg)"/>
  <circle cx="300" cy="380" r="250" fill="url(#halo)"/>
  ${inner}
  <g fill="${garment}" stroke="${deep}" stroke-width="4" stroke-linejoin="round">
    ${ART[art]}
  </g>
  </g>
  <text x="300" y="742" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="25" fill="${deep}" opacity="0.8">Babli · ${esc(name)}</text>
</svg>`;
}

for (const [slug, name, art, bg, garment, deep] of PRODUCTS) {
  writeFileSync(join(OUT, `${slug}-1.svg`), makeSvg(name, art, bg, garment, deep, 0));
  writeFileSync(join(OUT, `${slug}-2.svg`), makeSvg(name, art, bg, garment, deep, 1));
  console.log(`✔ ${slug}-1.svg / ${slug}-2.svg`);
}
console.log(`Done — ${PRODUCTS.length * 2} placeholder images in ${OUT}`);
