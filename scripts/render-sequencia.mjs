// Renderiza a sequência de quadros do hero a partir dos modelos em modelos/*.glb.
// Uso:
//   node scripts/render-sequencia.mjs                 # desktop e celular, completos
//   node scripts/render-sequencia.mjs --teste <pasta> # só 3 quadros (0, 0.5, 1) de cada variante, em PNG
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { servir } from './render/servidor.mjs';

const RAIZ = resolve(import.meta.dirname, '..');
const PORTA = 4340;
/** Tamanho final de cada quadro; o render sai no dobro e é reduzido (supersampling). */
export const VARIANTES = {
  desktop: { quadros: 120, largura: 1200, altura: 1000, qualidade: 74 },
  celular: { quadros: 60, largura: 780, altura: 1040, qualidade: 60 },
};

function executavel() {
  if (existsSync(chromium.executablePath())) return undefined;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  const candidatos = [join(base, 'chromium', 'chrome-linux64', 'chrome')];
  if (existsSync(base)) {
    for (const d of readdirSync(base).filter((n) => /^chromium-\d+$/.test(n))) {
      candidatos.push(join(base, d, 'chrome-linux64', 'chrome'));
    }
  }
  return candidatos.find((c) => existsSync(c));
}

const iTeste = process.argv.indexOf('--teste');
const iVariante = process.argv.indexOf('--variante');
const soVariante = iVariante >= 0 ? process.argv[iVariante + 1] : null;
const pastaTeste = iTeste >= 0 ? resolve(process.argv[iTeste + 1]) : null;

const servidor = await servir(PORTA);
const navegador = await chromium.launch({
  executablePath: executavel(),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  for (const [nome, v] of Object.entries(VARIANTES)) {
    if (soVariante && nome !== soVariante) continue;
    const w = v.largura * 2;
    const h = v.altura * 2;
    const pagina = await navegador.newPage({ viewport: { width: w, height: h } });
    pagina.on('pageerror', (e) => console.error('erro na cena:', e.message));
    pagina.on('console', (m) => pastaTeste && console.log('cena:', m.text()));
    await pagina.goto(`http://127.0.0.1:${PORTA}/scripts/render/cena.html?variante=${nome}&w=${w}&h=${h}`);
    await pagina.waitForFunction(() => window.pronto === true, null, { timeout: 120_000 });

    const progressos = pastaTeste ? [0, 0.35, 0.7, 1] : Array.from({ length: v.quadros }, (_, i) => i / (v.quadros - 1));
    const saida = pastaTeste ?? join(RAIZ, 'public/hero/seq', nome);
    if (!pastaTeste) rmSync(saida, { recursive: true, force: true });
    mkdirSync(saida, { recursive: true });

    for (const [i, p] of progressos.entries()) {
      const dataUrl = await pagina.evaluate((x) => window.renderizar(x), p);
      const png = Buffer.from(dataUrl.split(',')[1], 'base64');
      const img = sharp(png).resize(v.largura, v.altura);
      if (pastaTeste) await img.png().toFile(join(saida, `${nome}-${p}.png`));
      else await img.webp({ quality: v.qualidade, alphaQuality: 80, effort: 5 }).toFile(join(saida, `${String(i).padStart(3, '0')}.webp`));
      if (!pastaTeste && i % 10 === 0) console.log(`${nome}: ${i + 1}/${progressos.length}`);
    }
    await pagina.close();
  }
} finally {
  await navegador.close();
  servidor.close();
}
