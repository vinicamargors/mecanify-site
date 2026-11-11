import { chromium, defineConfig } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PORTA = 4329;

/** Usa o Chromium pré-instalado quando o do Playwright não existe (nunca rodamos `playwright install` aqui). */
function executavelDeFallback(): string | undefined {
  if (existsSync(chromium.executablePath())) return undefined;
  const raiz = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  const candidatos = [join(raiz, 'chromium', 'chrome-linux64', 'chrome')];
  if (existsSync(raiz)) {
    for (const d of readdirSync(raiz).filter((n) => /^chromium-\d+$/.test(n))) {
      candidatos.push(join(raiz, d, 'chrome-linux64', 'chrome'));
    }
  }
  return candidatos.find((c) => existsSync(c));
}

const executablePath = executavelDeFallback();

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  outputDir: '../test-results',
  reporter: [['list']],
  fullyParallel: true,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: `http://127.0.0.1:${PORTA}`,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    locale: 'pt-BR',
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: 'desktop-1440', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-390', use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
  ],
  webServer: {
    command: `env -u AI_AGENT sh -c 'npx astro build && npx astro preview --ignore-lock --host 127.0.0.1 --port ${PORTA}'`,
    cwd: '..',
    url: `http://127.0.0.1:${PORTA}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      PUBLIC_GA4_ID: 'G-TESTE',
      PUBLIC_META_PIXEL_ID: '000TESTE',
      PUBLIC_GOOGLE_ADS_ID: 'AW-TESTE',
      PUBLIC_GOOGLE_ADS_CONVERSION_LABEL: 'LABELTESTE',
    },
  },
});
