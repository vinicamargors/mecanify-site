import { expect, test, type Page } from '@playwright/test';

const fundo = (page: Page) => page.locator('#fundo-site');
const anel = async (page: Page) => {
  const v = (await fundo(page).getAttribute('data-anel')) ?? '0,0';
  const [x, y] = v.split(',').map(Number);
  return { x, y };
};
const quadros = async (page: Page) => Number(await fundo(page).getAttribute('data-quadros'));

test('fundo animado cobre a tela inteira, fixo e discreto', async ({ page }) => {
  await page.goto('/');
  await expect(fundo(page)).toHaveAttribute('data-ativo', '');
  const estilo = await fundo(page).evaluate((el) => {
    const s = getComputedStyle(el);
    return { position: s.position, opacidade: Number(s.opacity), w: el.clientWidth, h: el.clientHeight };
  });
  expect(estilo.position).toBe('fixed');
  expect(estilo.opacidade).toBeLessThanOrEqual(0.5);
  expect(estilo.w).toBe(page.viewportSize()!.width);
  expect(estilo.h).toBe(page.viewportSize()!.height);
});

test('continua animando no meio da página', async ({ page }) => {
  await page.goto('/');
  await expect(fundo(page)).toHaveAttribute('data-ativo', '');
  await page.evaluate(() => document.getElementById('planos')!.scrollIntoView({ behavior: 'instant' }));
  const a = await quadros(page);
  await expect.poll(() => quadros(page)).toBeGreaterThan(a + 5);
});

test('também aparece nas páginas legais', async ({ page }) => {
  await page.goto('/privacidade');
  await expect(fundo(page)).toHaveAttribute('data-ativo', '');
});

test('desktop: o anel vai na direção do mouse em qualquer ponto da página', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, 'mouse só no desktop');
  await page.goto('/');
  await expect(fundo(page)).toHaveAttribute('data-ativo', '');
  await page.evaluate(() => document.getElementById('planos')!.scrollIntoView({ behavior: 'instant' }));
  const { width, height } = page.viewportSize()!;
  await page.mouse.move(width * 0.95, height * 0.5);
  await expect.poll(async () => (await anel(page)).x, { timeout: 4000 }).toBeGreaterThan(0.05);
  await page.mouse.move(width * 0.05, height * 0.5);
  await expect.poll(async () => (await anel(page)).x, { timeout: 4000 }).toBeLessThan(-0.05);
});

test('a rolagem move o anel na vertical', async ({ page }) => {
  await page.goto('/');
  await expect(fundo(page)).toHaveAttribute('data-ativo', '');
  await page.waitForTimeout(600);
  const antes = (await anel(page)).y;
  // ~1.100px = um quarto de onda: deslocamento máximo para baixo.
  await page.evaluate(() => window.scrollTo(0, 1100));
  await expect.poll(async () => (await anel(page)).y, { timeout: 5000 }).toBeLessThan(antes - 0.03);
});

test('celular: o anel fica dentro da área visível', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'só no celular');
  await page.goto('/');
  await expect(fundo(page)).toHaveAttribute('data-ativo', '');
  for (const y of [0, 1100, 3000]) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(1500);
    const a = await anel(page);
    // Meia-largura visível no celular: 1.4 de mundo = 0.28 em unidades do campo (MEIA_LARGURA_MIN / WORLD).
    expect(Math.abs(a.x)).toBeLessThan(0.28);
  }
});

test.describe('reduzir movimento', () => {
  test.use({ reducedMotion: 'reduce' });
  test('desenha um quadro só e para', async ({ page }) => {
    await page.goto('/');
    await expect(fundo(page)).toHaveAttribute('data-estatico', '');
    await page.waitForTimeout(500);
    expect(await quadros(page)).toBeLessThanOrEqual(2);
  });
});

test('sem WebGL: não monta e o console fica limpo', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto('/');
  await page.waitForTimeout(800);
  await expect(fundo(page)).not.toHaveAttribute('data-ativo', '');
  expect(erros).toEqual([]);
});
