import { describe, expect, it } from 'vitest';
import { precisaAviso, substituirMarcadores } from '../../src/lib/legal';

const dados = { empresa: 'Mecanify', email: 'contato@mecanify.com.br' };

describe('substituirMarcadores', () => {
  it('troca todos os marcadores conhecidos', () => {
    expect(substituirMarcadores('{{empresa}}: {{email}} ({{empresa}})', dados)).toBe(
      'Mecanify: contato@mecanify.com.br (Mecanify)',
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
