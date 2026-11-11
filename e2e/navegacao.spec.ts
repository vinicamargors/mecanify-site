import { expect, test } from '@playwright/test';

test('CTAs de cadastro repassam utm_*', async ({ page }) => {
  await page.goto('/?utm_source=ig');
  const ctas = page.locator('[data-cta=cadastro]');
  expect(await ctas.count()).toBeGreaterThan(0);
  for (const href of await ctas.evaluateAll((els) => els.map((e) => e.getAttribute('href')))) {
    expect(href).toContain('modo=cadastro&utm_source=ig');
  }
});

test('contato: WhatsApp flutuante, e-mail e dados da empresa', async ({ page }) => {
  await page.goto('/');
  const zap = page.getByRole('link', { name: 'Falar no WhatsApp' });
  await expect(zap).toBeVisible();
  expect(await zap.getAttribute('href')).toMatch(/^https:\/\/wa\.me\//);
  expect(await page.locator('footer a[href^="mailto:"]').first().getAttribute('href')).toMatch(/^mailto:/);
  await expect(page.locator('footer')).toContainText('CNPJ');
});

test('header: Entrar aponta para o app', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header').getByRole('link', { name: 'Entrar' })).toHaveAttribute(
    'href',
    'https://app.mecanify.com.br/',
  );
});

test('alvos do header com pelo menos 44px', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('header a:visible, header button:visible');
  const n = await links.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const box = await links.nth(i).boundingBox();
    expect(box?.height ?? 0, `alvo ${i}`).toBeGreaterThanOrEqual(44);
  }
});
