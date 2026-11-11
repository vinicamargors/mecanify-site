import { expect, test, type Page } from '@playwright/test';

const fundo = (page: Page) => page.locator('#hero-fundo');
const anel = async (page: Page) => {
  const v = (await fundo(page).getAttribute('data-anel')) ?? '0,0';
  const [x, y] = v.split(',').map(Number);
  return { x, y };
};
const quadros = async (page: Page) => Number(await fundo(page).getAttribute('data-quadros'));

test('fundo animado monta atrás do hero', async ({ page }) => {
  await page.goto('/');
  await expect(fundo(page)).toHaveAttribute('data-ativo', '');
  await expect.poll(() => quadros(page)).toBeGreaterThan(5);
});

test('desktop: o anel vai na direção do mouse', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, 'mouse só no desktop');
  await page.goto('/');
  await expect(fundo(page)).toHaveAttribute('data-ativo', '');
  const caixa = (await fundo(page).boundingBox())!;
  await page.mouse.move(caixa.x + caixa.width * 0.95, caixa.y + caixa.height * 0.5);
  await expect.poll(async () => (await anel(page)).x, { timeout: 4000 }).toBeGreaterThan(0.05);
  await page.mouse.move(caixa.x + caixa.width * 0.05, caixa.y + caixa.height * 0.5);
  await expect.poll(async () => (await anel(page)).x, { timeout: 4000 }).toBeLessThan(-0.05);
});

test('a rolagem desloca o anel para baixo', async ({ page }) => {
  await page.goto('/');
  await expect(fundo(page)).toHaveAttribute('data-ativo', '');
  await page.waitForTimeout(600);
  const antes = (await anel(page)).y;
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect.poll(async () => (await anel(page)).y, { timeout: 5000 }).toBeLessThan(antes - 0.05);
});

test('pausa quando o hero sai da tela', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => quadros(page)).toBeGreaterThan(5);
  await page.evaluate(() => document.getElementById('planos')!.scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(400);
  const parado = await quadros(page);
  await page.waitForTimeout(600);
  expect(await quadros(page)).toBe(parado);
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
