export type Consentimento = { analytics: boolean; marketing: boolean; versao: number; em: number };

export const VERSAO_POLITICA = 1;
export const VALIDADE_MS = 365 * 24 * 3600 * 1000;
export const CHAVE = 'mecanify_consentimento';

/** Cópia da escolha para a sessão, usada só quando o localStorage está indisponível. */
let emMemoria: Consentimento | null = null;

function valido(c: unknown, agora: number): c is Consentimento {
  if (typeof c !== 'object' || c === null) return false;
  const o = c as Record<string, unknown>;
  return (
    typeof o.analytics === 'boolean' &&
    typeof o.marketing === 'boolean' &&
    typeof o.versao === 'number' &&
    typeof o.em === 'number' &&
    o.versao === VERSAO_POLITICA &&
    agora - o.em <= VALIDADE_MS
  );
}

export function lerConsentimento(agora: number = Date.now()): Consentimento | null {
  let bruto: string | null;
  try {
    bruto = localStorage.getItem(CHAVE);
  } catch {
    return valido(emMemoria, agora) ? emMemoria : null;
  }
  if (!bruto) return null;
  try {
    const c: unknown = JSON.parse(bruto);
    return valido(c, agora) ? c : null;
  } catch {
    return null;
  }
}

export function salvarConsentimento(
  escolha: Pick<Consentimento, 'analytics' | 'marketing'>,
  agora: number = Date.now(),
): Consentimento {
  const c: Consentimento = { ...escolha, versao: VERSAO_POLITICA, em: agora };
  emMemoria = c;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(c));
  } catch {
    // sem armazenamento: a escolha vale só até recarregar
  }
  return c;
}

export function limparConsentimento(): void {
  emMemoria = null;
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // ignora
  }
}
