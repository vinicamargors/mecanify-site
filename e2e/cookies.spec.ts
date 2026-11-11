import { expect, test, type Page } from '@playwright/test';

const HOSTS_TAGS = /googletagmanager\.com|connect\.facebook\.net/;

/** Intercepta as tags externas, registra as requisições e responde vazio. */
async function espiarTags(page: Page) {
  const urls: string[] = [];
  // O script do Vercel Analytics só existe na Vercel; localmente responde vazio.
  await page.route('**/_vercel/insights/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );
  await page.route(HOSTS_TAGS, (route) => {
    urls.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  return urls;
}

const banner = (page: Page) => page.getByRole('dialog', { name: 'Cookies' });

test('primeira visita: banner com 3 opções e nenhuma tag carregada', async ({ page }) => {
  const urls = await espiarTags(page);
  await page.goto('/');
  await expect(banner(page)).toBeVisible();
  for (const nome of ['Aceitar', 'Recusar', 'Personalizar']) {
    await expect(banner(page).getByRole('button', { name: nome })).toBeVisible();
  }
  await page.waitForTimeout(500);
  expect(urls).toEqual([]);
});

test('Recusar: banner some, não volta ao recarregar e nada é carregado', async ({ page }) => {
  const urls = await espiarTags(page);
  await page.goto('/');
  await banner(page).getByRole('button', { name: 'Recusar' }).click();
  await expect(banner(page)).toBeHidden();
  await page.reload();
  await page.waitForTimeout(500);
  await expect(banner(page)).toBeHidden();
  expect(urls).toEqual([]);
});

test('Personalizar só com Analytics: GA4 sim, Pixel e Ads não', async ({ page }) => {
  const urls = await espiarTags(page);
  await page.goto('/');
  await banner(page).getByRole('button', { name: 'Personalizar' }).click();
  await banner(page).getByRole('checkbox', { name: 'Analytics' }).check();
  await banner(page).getByRole('button', { name: 'Salvar escolha' }).click();
  await expect.poll(() => urls.some((u) => u.includes('gtag/js?id=G-TESTE'))).toBe(true);
  expect(urls.some((u) => u.includes('facebook'))).toBe(false);
  expect(urls.some((u) => u.includes('AW-TESTE'))).toBe(false);
});

test('Aceitar: GA4, Pixel e Ads carregam', async ({ page }) => {
  const urls = await espiarTags(page);
  await page.goto('/');
  await banner(page).getByRole('button', { name: 'Aceitar' }).click();
  await expect.poll(() => urls.some((u) => u.includes('gtag/js?id=G-TESTE'))).toBe(true);
  expect(urls.some((u) => u.includes('connect.facebook.net'))).toBe(true);
  expect(urls.some((u) => u.includes('gtag/js?id=AW-TESTE'))).toBe(true);
});

test('revogar Marketing pelo rodapé atualiza o Consent Mode e o Pixel', async ({ page }) => {
  await espiarTags(page);
  await page.goto('/');
  await banner(page).getByRole('button', { name: 'Aceitar' }).click();
  await page.getByRole('button', { name: 'Preferências de cookies' }).click();
  await expect(banner(page)).toBeFocused();
  await banner(page).getByRole('checkbox', { name: 'Marketing' }).uncheck();
  await banner(page).getByRole('button', { name: 'Salvar escolha' }).click();

  const consentUpdates = await page.evaluate(() =>
    (window as any).dataLayer
      .map((e: any) => Array.from(e))
      .filter((e: any[]) => e[0] === 'consent' && e[1] === 'update'),
  );
  expect(consentUpdates.at(-1)[2]).toMatchObject({ ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  const fbq = await page.evaluate(() => (window as any).fbq.queue.map((a: any) => Array.from(a)));
  expect(fbq).toContainEqual(['consent', 'revoke']);
});

test('sem PUBLIC_GA4_ID: Aceitar não requisita GA4 e o console fica limpo', async ({ page }) => {
  const urls = await espiarTags(page);
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  await page.route('**/', async (route) => {
    if (route.request().resourceType() !== 'document') return route.fallback();
    const r = await route.fetch();
    const html = (await r.text()).replace(/"ga4":"[^"]*"/, '"ga4":""');
    return route.fulfill({ response: r, body: html });
  });
  await page.goto('/');
  await banner(page).getByRole('button', { name: 'Aceitar' }).click();
  await page.waitForTimeout(500);
  expect(urls.some((u) => u.includes('gtag/js?id=G-'))).toBe(false);
  expect(erros).toEqual([]);
});

test('banner funciona só com teclado', async ({ page }) => {
  await espiarTags(page);
  await page.goto('/');
  await banner(page).getByRole('button', { name: 'Recusar' }).focus();
  await page.keyboard.press('Enter');
  await expect(banner(page)).toBeHidden();
});

/** Eventos de conversão gravados no dataLayer (formato gtag: ['event', nome, params]). */
async function eventos(page: Page): Promise<[string, Record<string, string> | undefined][]> {
  return page.evaluate(() =>
    (window as any).dataLayer
      .map((e: any) => Array.from(e))
      .filter((e: any[]) => e[0] === 'event')
      .map((e: any[]) => [e[1], e[2]]),
  );
}

async function semNavegar(page: Page) {
  await page.route(/app\.mecanify\.com\.br|wa\.me/, (r) => r.fulfill({ status: 200, body: 'ok' }));
}

test.describe('eventos de conversão', () => {
  test('com consentimento: cta, WhatsApp e toggle anual viram eventos', async ({ page }) => {
    await espiarTags(page);
    await semNavegar(page);
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Aceitar' }).click();

    await page.evaluate(() => document.querySelectorAll('a').forEach((a) => a.addEventListener('click', (e) => e.preventDefault())));
    await page.locator('main [data-cta-origem=hero]').click();
    await page.getByRole('link', { name: 'Falar no WhatsApp' }).click();
    await page.locator('#planos').getByRole('radio', { name: /Anual/ }).click();

    const nomes = (await eventos(page)).map(([n]) => n);
    expect(nomes).toContain('cta_cadastro');
    expect(nomes).toContain('whatsapp_click');
    expect(nomes).toContain('plano_toggle_anual');
    expect((await eventos(page)).find(([n]) => n === 'cta_cadastro')?.[1]).toMatchObject({ origem: 'hero' });
  });

  test('sem consentimento: nenhum evento é enviado', async ({ page }) => {
    await espiarTags(page);
    await semNavegar(page);
    await page.goto('/');
    await page.evaluate(() => document.querySelectorAll('a').forEach((a) => a.addEventListener('click', (e) => e.preventDefault())));
    await page.locator('main [data-cta-origem=hero]').click();
    await page.locator('#planos').getByRole('radio', { name: /Anual/ }).click();
    expect(await eventos(page)).toEqual([]);
  });

  test('conversão: Ads e Pixel só com Marketing', async ({ page }) => {
    await espiarTags(page);
    await semNavegar(page);
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Aceitar' }).click();
    await page.evaluate(() => document.querySelectorAll('a').forEach((a) => a.addEventListener('click', (e) => e.preventDefault())));
    await page.locator('main [data-cta-origem=hero]').click();
    const conversao = (await eventos(page)).find(([n]) => n === 'conversion');
    expect(conversao?.[1]).toMatchObject({ send_to: 'AW-TESTE/LABELTESTE' });
    const fbq = await page.evaluate(() => (window as any).fbq.queue.map((a: any) => Array.from(a)));
    expect(fbq).toContainEqual(['track', 'Lead']);
  });
});
