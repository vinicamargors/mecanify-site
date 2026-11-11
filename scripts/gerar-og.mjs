// Gera public/og.png (1200x630). Rodar: node scripts/gerar-og.mjs
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const logo = readFileSync(new URL('../public/logo.svg', import.meta.url));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#111214"/>
  <text x="120" y="400" font-family="sans-serif" font-size="72" font-weight="600" fill="#F2F0EB">Sistema para</text>
  <text x="120" y="490" font-family="sans-serif" font-size="72" font-weight="600" fill="#F5A524">oficina mecânica</text>
</svg>`;
await sharp(Buffer.from(svg))
  .composite([{ input: await sharp(logo).resize(160, 160).png().toBuffer(), left: 120, top: 100 }])
  .png()
  .toFile(new URL('../public/og.png', import.meta.url).pathname);
