// Converte prints do sistema (PNG @2x, tema escuro) em AVIF/WebP para src/assets/telas.
// Uso: node scripts/importar-prints.mjs <pasta-com-prints>
// Espera arquivos <tela>-<largura>.png (telas: radar ordens estoque financeiro equipe; larguras: 1440 390).
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const pasta = process.argv[2];
if (!pasta) {
  console.error('Uso: node scripts/importar-prints.mjs <pasta-com-prints>');
  process.exit(1);
}
const TELAS = ['radar', 'ordens', 'estoque', 'financeiro', 'equipe'];
const LARGURAS = { 1440: 1800, 390: 780 };
const saida = resolve(import.meta.dirname, '../src/assets/telas');
mkdirSync(saida, { recursive: true });

for (const tela of TELAS) {
  for (const [nome, largura] of Object.entries(LARGURAS)) {
    const origem = join(pasta, `${tela}-${nome}.png`);
    if (!existsSync(origem)) throw new Error(`faltando ${origem}`);
    const img = () => sharp(readFileSync(origem)).resize({ width: largura });
    await img().avif({ quality: 55 }).toFile(join(saida, `${tela}-${nome}.avif`));
    await img().webp({ quality: 75 }).toFile(join(saida, `${tela}-${nome}.webp`));
    console.log(`ok ${tela}-${nome}`);
  }
}
