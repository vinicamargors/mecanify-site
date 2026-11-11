import { expect, test } from '@playwright/test';

test.describe('com JavaScript', () => {
  test('planos começam no mensal', async ({ page }) => {
    await page.goto('/');
    const planos = page.locator('#planos');
    for (const preco of ['R$ 97', 'R$ 197', 'R$ 347']) {
      await expect(planos.getByText(preco, { exact: true })).toBeVisible();
    }
    await expect(planos.getByText('R$ 164', { exact: true })).toBeHidden();
  });

  test('toggle Anual troca os valores e mostra 2 meses grátis', async ({ page }) => {
    await page.goto('/');
    const planos = page.locator('#planos');
    await planos.getByRole('radio', { name: /Anual/ }).click();
    for (const preco of ['R$ 80', 'R$ 164', 'R$ 289']) {
      await expect(planos.getByText(preco, { exact: true })).toBeVisible();
    }
    await expect(planos.getByText('R$ 197', { exact: true })).toBeHidden();
    await expect(planos.getByText('2 meses grátis').first()).toBeVisible();
  });

  test('toggle de período opera por teclado', async ({ page }) => {
    await page.goto('/');
    const grupo = page.locator('#planos').getByRole('radiogroup', { name: 'Período de cobrança' });
    await grupo.getByRole('radio', { name: 'Mensal' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(grupo.getByRole('radio', { name: /Anual/ })).toBeChecked();
    await page.keyboard.press('ArrowLeft');
    await expect(grupo.getByRole('radio', { name: 'Mensal' })).toBeChecked();
  });

  test('Pátio Pro tem a etiqueta Mais escolhido', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#planos').getByText('Mais escolhido')).toHaveCount(1);
  });

  test('abas do tour: setas trocam aba e tela', async ({ page }) => {
    await page.goto('/');
    const abas = page.getByRole('tablist', { name: 'Telas do sistema' });
    const primeira = abas.getByRole('tab').first();
    await expect(primeira).toHaveAttribute('aria-selected', 'true');
    await primeira.focus();
    await page.keyboard.press('ArrowRight');
    const segunda = abas.getByRole('tab').nth(1);
    await expect(segunda).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await expect(page.getByRole('tabpanel').locator('img').first()).toBeVisible();
  });

  test('não promete bot nem multi-unidades', async ({ page }) => {
    await page.goto('/');
    const texto = await page.locator('body').innerText();
    expect(texto).not.toMatch(/\bbot\b/i);
    expect(texto).not.toMatch(/multi-?unidades?/i);
  });

  test('JSON-LD: SoftwareApplication com 3 ofertas e FAQPage', async ({ page }) => {
    await page.goto('/');
    const blocos = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((b) => JSON.parse(b));
    const app = blocos.find((b) => b['@type'] === 'SoftwareApplication');
    expect(app.offers.map((o: any) => o.price)).toEqual(['97', '197', '347']);
    expect(app.offers.every((o: any) => o.priceCurrency === 'BRL')).toBe(true);
    expect(blocos.some((b) => b['@type'] === 'FAQPage')).toBe(true);
  });
});

test.describe('sem JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('mensal visível, primeira tela do tour e CTAs de cadastro', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#planos').getByText('R$ 197', { exact: true })).toBeVisible();
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    const hrefs = await page.locator('[data-cta=cadastro]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(3);
    for (const h of hrefs) expect(h).toContain('modo=cadastro');
  });
});
