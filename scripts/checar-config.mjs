// Avisa (sem falhar o build) o que falta preencher antes de publicar.
import { readFileSync } from 'node:fs';

const IDS = ['PUBLIC_GA4_ID', 'PUBLIC_META_PIXEL_ID', 'PUBLIC_GOOGLE_ADS_ID', 'PUBLIC_GOOGLE_ADS_CONVERSION_LABEL'];
// CHECAR_CONFIG_ARQUIVO só existe para os testes apontarem outro arquivo.
const arquivo = process.env.CHECAR_CONFIG_ARQUIVO ?? new URL('../src/site.config.ts', import.meta.url);
const texto = readFileSync(arquivo, 'utf8');

const pendencias = [];
const placeholders = [];
texto.split('\n').forEach((linha, i) => {
  const m = linha.match(/^\s*([A-Za-z]+):\s*'TODO_PREENCHER'/);
  if (m) {
    placeholders.push(m[1]);
    pendencias.push(`src/site.config.ts:${i + 1}  ${m[1]}`);
  }
});
for (const id of IDS) {
  if (!process.env[id]) pendencias.push(`variável ${id} vazia (ferramenta desligada)`);
}

if (pendencias.length) {
  console.warn('\n⚠ Antes de publicar:');
  for (const p of pendencias) console.warn(`  - ${p}`);
  console.warn('  Veja a seção "Antes de publicar" do README.md.\n');
}

// Produção na Vercel não sobe com dados de contato/empresa por preencher (IDs de rastreio vazios só avisam).
if (process.env.VERCEL_ENV === 'production' && placeholders.length && process.env.PERMITIR_PLACEHOLDERS) {
  console.warn('⚠ PERMITIR_PLACEHOLDERS está ativo: este build de produção sobe com dados por preencher. Remova a variável antes de ir ao ar de verdade.');
} else if (process.env.VERCEL_ENV === 'production' && placeholders.length) {
  console.error(`✖ Build de produção bloqueado: preencha ${placeholders.join(', ')} em src/site.config.ts.`);
  process.exit(1);
}
