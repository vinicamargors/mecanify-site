import { expect, test } from '@playwright/test';

test('home: SEO básico e JSON-LD Organization', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page).toHaveTitle(/Mecanify/);
  expect((await page.locator('meta[name=description]').getAttribute('content'))?.length).toBeGreaterThan(40);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://mecanify.com.br/');
  expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toMatch(/^https:\/\/mecanify\.com\.br\/.+/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');

  const blocos = await page.locator('script[type="application/ld+json"]').allTextContents();
  const tipos = blocos.flatMap((b) => {
    const j = JSON.parse(b);
    return Array.isArray(j) ? j.map((x) => x['@type']) : [j['@type']];
  });
  expect(tipos).toContain('Organization');
});

test('robots.txt aponta o sitemap', async ({ request }) => {
  const r = await request.get('/robots.txt');
  expect(r.ok()).toBe(true);
  expect(await r.text()).toContain('Sitemap: https://mecanify.com.br/sitemap-index.xml');
});

test('404 tem link para a home', async ({ page }) => {
  const r = await page.goto('/nao-existe');
  expect(r?.status()).toBe(404);
  await expect(page.getByRole('link', { name: /voltar/i })).toHaveAttribute('href', '/');
});
