// Avisa (sem falhar o build) o que falta preencher antes de publicar.
import { readFileSync } from 'node:fs';

const IDS = ['PUBLIC_GA4_ID', 'PUBLIC_META_PIXEL_ID', 'PUBLIC_GOOGLE_ADS_ID', 'PUBLIC_GOOGLE_ADS_CONVERSION_LABEL'];
const texto = readFileSync(new URL('../src/site.config.ts', import.meta.url), 'utf8');

const pendencias = [];
texto.split('\n').forEach((linha, i) => {
  const m = linha.match(/^\s*([A-Za-z]+):\s*'TODO_PREENCHER'/);
  if (m) pendencias.push(`src/site.config.ts:${i + 1}  ${m[1]}`);
});
for (const id of IDS) {
  if (!process.env[id]) pendencias.push(`variável ${id} vazia (ferramenta desligada)`);
}

if (pendencias.length) {
  console.warn('\n⚠ Antes de publicar:');
  for (const p of pendencias) console.warn(`  - ${p}`);
  console.warn('  Veja a seção "Antes de publicar" do README.md.\n');
}
