import { describe, expect, it } from 'vitest';
import { linkCadastro, linkEmail, linkWhatsApp } from '../../src/lib/links';

describe('linkCadastro', () => {
  it('sem busca devolve o cadastro puro', () => {
    expect(linkCadastro('')).toBe('https://app.mecanify.com.br/?modo=cadastro');
  });

  it('repassa utm_* e gclid/fbclid codificados e descarta o resto', () => {
    expect(linkCadastro('?utm_source=google&utm_campaign=revisão de férias&x=1&gclid=abc')).toBe(
      'https://app.mecanify.com.br/?modo=cadastro&utm_source=google&utm_campaign=revis%C3%A3o+de+f%C3%A9rias&gclid=abc',
    );
  });

  it('mantém & codificado dentro do valor', () => {
    expect(linkCadastro('?utm_term=a%26b')).toContain('utm_term=a%26b');
  });

  it('não quebra com busca malformada', () => {
    expect(linkCadastro('?utm_source=%E0%A4%A')).toContain('modo=cadastro');
  });
});

describe('linkWhatsApp / linkEmail', () => {
  it('monta wa.me com texto codificado', () => {
    expect(linkWhatsApp('5511999999999', 'Olá, quero conhecer o Mecanify')).toBe(
      'https://wa.me/5511999999999?text=Ol%C3%A1%2C%20quero%20conhecer%20o%20Mecanify',
    );
  });

  it('monta mailto com assunto codificado', () => {
    expect(linkEmail('contato@x.com', 'Quero conhecer o Mecanify')).toBe(
      'mailto:contato@x.com?subject=Quero%20conhecer%20o%20Mecanify',
    );
  });
});
