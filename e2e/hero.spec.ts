import { expect, test, type Page } from '@playwright/test';

const QUADROS = { desktop: 120, celular: 60 };
const largura = (page: Page) => page.viewportSize()?.width ?? 0;
const ehCelular = (page: Page) => largura(page) < 768;
const seq = (page: Page) => page.locator('#hero-seq');
const quadro = (page: Page) => async () => Number(await seq(page).getAttribute('data-quadro'));
const total = (page: Page) => (ehCelular(page) ? QUADROS.celular : QUADROS.desktop);

async function fimDoPalco(page: Page): Promise<number> {
  return page.evaluate(() => {
    const celular = matchMedia('(max-width: 767px)').matches;
    const palco = document.querySelector<HTMLElement>(celular ? '[data-palco-visual]' : '[data-hero-palco]')!;
    const fixo = document.querySelector<HTMLElement>(celular ? '[data-fixo-visual]' : '[data-hero-fixo]')!;
    const topo = palco.getBoundingClientRect().top + window.scrollY;
    return topo + palco.offsetHeight - fixo.offsetHeight - parseFloat(getComputedStyle(fixo).top);
  });
}

test('o primeiro quadro aparece já no carregamento', async ({ page }) => {
  await page.goto('/');
  await expect(seq(page)).toHaveAttribute('data-quadro', '0');
  await expect(page.locator('#hero-poster img')).toHaveAttribute('src', /\/hero\/seq\/(desktop|celular)\/000\.webp$/);
});

test('a rolagem avança os quadros até o último, com o visual preso na tela', async ({ page }) => {
  await page.goto('/');
  await expect(seq(page)).toHaveAttribute('data-quadro', '0');
  const fim = await fimDoPalco(page);
  // Celular: o visual só prende depois que o texto sai; começa pelo início do palco do visual.
  const inicio = ehCelular(page)
    ? await page.evaluate(() => {
        const p = document.querySelector<HTMLElement>('[data-palco-visual]')!;
        const f = document.querySelector<HTMLElement>('[data-fixo-visual]')!;
        return p.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(f).top);
      })
    : 0;
  await page.evaluate((y) => window.scrollTo(0, y), inicio);
  await page.waitForTimeout(200);
  const y0 = (await seq(page).boundingBox())!.y;

  await page.evaluate((y) => window.scrollTo(0, y), inicio + (fim - inicio) / 2);
  await expect.poll(quadro(page)).toBeGreaterThan(total(page) * 0.3);
  expect(Math.abs((await seq(page).boundingBox())!.y - y0)).toBeLessThanOrEqual(2);

  await page.evaluate((y) => window.scrollTo(0, y), fim);
  await expect.poll(quadro(page), { timeout: 8000 }).toBe(total(page) - 1);
});

test('todos os quadros terminam de carregar em segundo plano', async ({ page }) => {
  await page.goto('/');
  await expect
    .poll(async () => Number(await seq(page).getAttribute('data-carregados')), { timeout: 20_000 })
    .toBe(total(page));
});

test('peso da sequência dentro do orçamento', async ({ page }) => {
  const bytes = new Map<string, number>();
  page.on('response', async (r) => {
    if (/\/hero\/seq\//.test(r.url())) bytes.set(r.url(), (await r.body()).length);
  });
  await page.goto('/');
  await expect
    .poll(async () => Number(await seq(page).getAttribute('data-carregados')), { timeout: 20_000 })
    .toBe(total(page));
  await page.waitForTimeout(300);
  const soma = [...bytes.values()].reduce((a, b) => a + b, 0);
  expect(soma).toBeLessThanOrEqual(ehCelular(page) ? 2_000_000 : 6_000_000);
  // Celular nunca baixa a sequência do desktop, e vice-versa.
  const outra = ehCelular(page) ? '/desktop/' : '/celular/';
  expect([...bytes.keys()].some((u) => u.includes(outra))).toBe(false);
});

test.describe('reduzir movimento', () => {
  test.use({ reducedMotion: 'reduce' });
  test('mostra o último quadro, sem prender a tela', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-hero-animado', /.*/);
    await expect(seq(page)).toHaveAttribute('data-quadro', String(total(page) - 1));
    const altura = await page.evaluate(() => ({
      palco: document.querySelector<HTMLElement>('[data-hero-palco]')!.offsetHeight,
      janela: window.innerHeight,
    }));
    expect(altura.palco).toBeLessThan(altura.janela * 2);
  });
});

test.describe('sem JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('o pôster aparece', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#hero-poster img')).toBeVisible();
  });
});
