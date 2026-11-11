// Gera public/hero/fallback.{avif,webp} a partir da cena 3D (pose fixa).
// Pré-requisito: `npm run build`. Uso: node scripts/render-hero-fallback.mjs
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const raiz = resolve(import.meta.dirname, '..');
const PORTA = 4331;

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

const env = { ...process.env };
delete env.AI_AGENT;
const servidor = spawn('npx', ['astro', 'preview', '--ignore-lock', '--host', '127.0.0.1', '--port', String(PORTA)], {
  cwd: raiz,
  env,
  stdio: 'ignore',
});

try {
  await new Promise((ok, falha) => {
    const t0 = Date.now();
    const tenta = () =>
      fetch(`http://127.0.0.1:${PORTA}/`).then(ok, () =>
        Date.now() - t0 > 30_000 ? falha(new Error('preview não subiu')) : setTimeout(tenta, 300),
      );
    tenta();
  });

  const navegador = await chromium.launch({ executablePath: executavel() });
  const fundo = { r: 17, g: 18, b: 20, alpha: 1 };

  // Desktop (paisagem) e celular (retrato): a cena escolhe o enquadramento pelo formato da área.
  const variantes = [
    { nome: 'fallback', viewport: { width: 1440, height: 900 }, escala: 2, saida: [1200, 1000] },
    { nome: 'fallback-mobile', viewport: { width: 390, height: 1100 }, escala: 3, saida: [1000, 1200] },
  ];
  for (const v of variantes) {
    const pagina = await navegador.newPage({ viewport: v.viewport, deviceScaleFactor: v.escala });
    await pagina.goto(`http://127.0.0.1:${PORTA}/?render-fallback=1`);
    await pagina.addStyleTag({ content: '#banner-cookies, #whatsapp-flutuante { display: none !important; }' });
    await pagina.locator('#hero-fallback[data-oculto]').waitFor({ timeout: 20_000 });
    await pagina.waitForTimeout(300);
    const png = await pagina.locator('#hero-3d').screenshot();
    await pagina.close();
    const img = () => sharp(png).resize(v.saida[0], v.saida[1], { fit: 'contain', background: fundo });
    await img().avif({ quality: 55 }).toFile(join(raiz, `public/hero/${v.nome}.avif`));
    await img().webp({ quality: 80 }).toFile(join(raiz, `public/hero/${v.nome}.webp`));
  }
  await navegador.close();
  console.log('fallbacks do hero gerados');
} finally {
  servidor.kill('SIGKILL');
}
