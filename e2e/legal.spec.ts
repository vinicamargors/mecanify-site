import { expect, test } from '@playwright/test';

const PAGINAS = [
  { caminho: '/privacidade', titulo: 'Política de Privacidade' },
  { caminho: '/termos', titulo: 'Termos de Uso' },
  { caminho: '/cookies', titulo: 'Política de Cookies' },
];

for (const { caminho, titulo } of PAGINAS) {
  test(`${caminho}: título, aviso de rascunho e dados da empresa`, async ({ page }) => {
    await page.goto(caminho);
    await expect(page.locator('h1')).toHaveText(titulo);
    await expect(page.getByText('Rascunho — revisão jurídica pendente')).toBeVisible();
    const corpo = await page.locator('main').innerText();
    expect(corpo).toContain('contato@mecanify.com.br');
    expect(corpo).not.toContain('CNPJ');
    expect(corpo).not.toContain('TODO_PREENCHER');
    expect(corpo).not.toContain('{{');
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', `https://mecanify.com.br${caminho}`);
  });
}
