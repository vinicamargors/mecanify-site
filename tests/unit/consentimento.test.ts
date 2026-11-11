import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHAVE,
  VALIDADE_MS,
  VERSAO_POLITICA,
  limparConsentimento,
  lerConsentimento,
  salvarConsentimento,
} from '../../src/lib/consentimento';

const AGORA = 1_800_000_000_000;

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  limparConsentimento();
});

describe('consentimento', () => {
  it('sem nada salvo devolve null', () => {
    expect(lerConsentimento(AGORA)).toBeNull();
  });

  it('salva e lê de volta com a versão atual', () => {
    salvarConsentimento({ analytics: true, marketing: false }, AGORA);
    expect(lerConsentimento(AGORA + 1000)).toEqual({
      analytics: true,
      marketing: false,
      versao: VERSAO_POLITICA,
      em: AGORA,
    });
  });

  it('vence depois de 12 meses', () => {
    salvarConsentimento({ analytics: true, marketing: true }, AGORA);
    expect(lerConsentimento(AGORA + VALIDADE_MS - 1)).not.toBeNull();
    expect(lerConsentimento(AGORA + VALIDADE_MS + 1)).toBeNull();
  });

  it('versão antiga da política pergunta de novo', () => {
    localStorage.setItem(CHAVE, JSON.stringify({ analytics: true, marketing: true, versao: 0, em: AGORA }));
    expect(lerConsentimento(AGORA)).toBeNull();
  });

  it('JSON corrompido ou com tipos errados devolve null', () => {
    localStorage.setItem(CHAVE, '{quebrado');
    expect(lerConsentimento(AGORA)).toBeNull();
    localStorage.setItem(CHAVE, JSON.stringify({ analytics: 'sim', marketing: 1, versao: 1, em: 'ontem' }));
    expect(lerConsentimento(AGORA)).toBeNull();
  });

  it('localStorage indisponível: lê null, salva sem lançar e a escolha vale na sessão', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(lerConsentimento(AGORA)).toBeNull();
    expect(() => salvarConsentimento({ analytics: false, marketing: true }, AGORA)).not.toThrow();
    expect(lerConsentimento(AGORA + 1000)).toMatchObject({ analytics: false, marketing: true });
  });
});
