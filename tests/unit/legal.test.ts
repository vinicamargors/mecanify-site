import { describe, expect, it } from 'vitest';
import { precisaAviso, substituirMarcadores } from '../../src/lib/legal';

const dados = { razaoSocial: 'Oficina Digital Ltda', cnpj: '12.345.678/0001-90', email: 'contato@mecanify.com.br' };

describe('substituirMarcadores', () => {
  it('troca todos os marcadores conhecidos', () => {
    expect(substituirMarcadores('{{razaoSocial}}, CNPJ {{cnpj}} ({{razaoSocial}})', dados)).toBe(
      'Oficina Digital Ltda, CNPJ 12.345.678/0001-90 (Oficina Digital Ltda)',
    );
  });
  it('mantém marcador desconhecido à vista para ser notado', () => {
    expect(substituirMarcadores('{{naoExiste}}', dados)).toBe('{{naoExiste}}');
  });
});

describe('precisaAviso', () => {
  it('rascunho mostra o aviso e revisado não', () => {
    expect(precisaAviso(false)).toBe(true);
    expect(precisaAviso(true)).toBe(false);
  });
});
