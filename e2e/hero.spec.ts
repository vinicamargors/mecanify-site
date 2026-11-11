import { gzipSync } from 'node:zlib';
import { expect, test, type Page } from '@playwright/test';

/** O headless daqui tem poucos núcleos; simulamos um aparelho bom. */
async function aparelhoBom(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
  });
}

const canvas = (page: Page) => page.locator('#hero-3d canvas');
const fallback = (page: Page) => page.locator('#hero-fallback');

test('aparelho bom: canvas 3D monta e o fallback sai de cena', async ({ page }) => {
  await aparelhoBom(page);
  await page.goto('/');
  await expect(canvas(page)).toHaveCount(1);
  await expect(fallback(page)).toHaveAttribute('data-oculto', '');
});

test.describe('reduzir movimento', () => {
  test.use({ reducedMotion: 'reduce' });
  test('mantém o fallback e não cria canvas', async ({ page }) => {
    await aparelhoBom(page);
    await page.goto('/');
    await page.waitForTimeout(800);
    await expect(canvas(page)).toHaveCount(0);
    await expect(fallback(page)).not.toHaveAttribute('data-oculto', '');
    await expect(fallback(page)).toBeVisible();
  });
});

test('sem WebGL: fallback visível e console sem erro', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await aparelhoBom(page);
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto('/');
  await page.waitForTimeout(800);
  await expect(canvas(page)).toHaveCount(0);
  await expect(fallback(page)).toBeVisible();
  expect(erros).toEqual([]);
});

test('perda de contexto WebGL volta ao fallback', async ({ page }) => {
  await aparelhoBom(page);
  await page.goto('/');
  await expect(canvas(page)).toHaveCount(1);
  await canvas(page).evaluate((c) => c.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(canvas(page)).toHaveCount(0);
  await expect(fallback(page)).not.toHaveAttribute('data-oculto', '');
});

test('girar o celular ajusta o canvas sem erro', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await aparelhoBom(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(canvas(page)).toHaveCount(1);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect
    .poll(async () => {
      const [c, alvo] = await Promise.all([
        canvas(page).evaluate((e) => e.clientWidth),
        page.locator('#hero-3d').evaluate((e) => e.clientWidth),
      ]);
      return Math.abs(c - alvo);
    })
    .toBeLessThanOrEqual(1);
  expect(erros).toEqual([]);
});

test.describe('sem JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('fallback visível', async ({ page }) => {
    await page.goto('/');
    await expect(fallback(page)).toBeVisible();
  });
});

test('peso do 3D (JS gzip + texturas) até 600 KB', async ({ page }) => {
  let total = 0;
  const vistos = new Set<string>();
  page.on('response', async (r) => {
    const url = r.url();
    if (vistos.has(url)) return;
    const js3d = /\/_astro\/(Hero3D|three)[^/]*\.js$/.test(url);
    const textura = /\/_astro\/radar-(1440|390)[^/]*\.webp$/.test(url);
    if (!js3d && !textura) return;
    vistos.add(url);
    const corpo = await r.body();
    total += js3d ? gzipSync(corpo).length : corpo.length;
  });
  await aparelhoBom(page);
  await page.goto('/');
  await expect(canvas(page)).toHaveCount(1);
  await page.waitForTimeout(500);
  expect(vistos.size).toBeGreaterThanOrEqual(3);
  expect(total).toBeLessThanOrEqual(600_000);
});

const larguraDaTela = (page: Page) => page.viewportSize()?.width ?? 0;
const visual = (page: Page) => page.locator('#hero-3d');
const progresso = (page: Page) => async () => Number(await visual(page).getAttribute('data-progresso'));

test('desktop: hero fica preso e o progresso acompanha a rolagem', async ({ page }) => {
  test.skip(larguraDaTela(page) < 1024, 'hero preso só a partir de 1024px');
  await aparelhoBom(page);
  await page.goto('/');
  await expect(canvas(page)).toHaveCount(1);
  const y0 = (await visual(page).boundingBox())!.y;
  expect(await progresso(page)()).toBeLessThan(0.05);

  await page.evaluate(() => window.scrollTo(0, 400));
  await expect.poll(progresso(page)).toBeGreaterThan(0.1);
  expect(Math.abs((await visual(page).boundingBox())!.y - y0)).toBeLessThanOrEqual(2);

  const fimDoPalco = await page.evaluate(() => {
    const palco = document.querySelector<HTMLElement>('[data-hero-palco]')!;
    const fixo = document.querySelector<HTMLElement>('[data-hero-fixo]')!;
    return palco.offsetHeight - fixo.offsetHeight;
  });
  await page.evaluate((y) => window.scrollTo(0, y), fimDoPalco);
  await expect.poll(progresso(page)).toBeGreaterThan(0.98);

  await page.evaluate((y) => window.scrollTo(0, y + 500), fimDoPalco);
  await expect.poll(async () => (await visual(page).boundingBox())!.y).toBeLessThan(y0 - 400);
});

test('o notebook abre a tampa sozinho ao carregar', async ({ page }) => {
  await aparelhoBom(page);
  await page.goto('/');
  await expect(canvas(page)).toHaveCount(1);
  await expect.poll(async () => Number(await visual(page).getAttribute('data-abertura')), { timeout: 4000 }).toBeGreaterThan(0.99);
});

test('celular: sem hero preso, a página rola normalmente', async ({ page }) => {
  test.skip(larguraDaTela(page) >= 1024, 'só no celular');
  await aparelhoBom(page);
  await page.goto('/');
  await expect(canvas(page)).toHaveCount(1);
  const altura = await page.evaluate(() => ({
    palco: document.querySelector<HTMLElement>('[data-hero-palco]')!.offsetHeight,
    janela: window.innerHeight,
  }));
  expect(altura.palco).toBeLessThan(altura.janela * 1.4);
  const y0 = (await visual(page).boundingBox())!.y;
  await page.evaluate(() => window.scrollTo(0, 300));
  await expect.poll(async () => (await visual(page).boundingBox())!.y).toBeLessThan(y0 - 250);
});

test.describe('reduzir movimento no palco', () => {
  test.use({ reducedMotion: 'reduce' });
  test('não prende o hero nem reserva altura extra', async ({ page }) => {
    await aparelhoBom(page);
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-hero3d', /.*/);
    const altura = await page.evaluate(() => ({
      palco: document.querySelector<HTMLElement>('[data-hero-palco]')!.offsetHeight,
      janela: window.innerHeight,
    }));
    expect(altura.palco).toBeLessThan(altura.janela * 1.4);
  });
});
