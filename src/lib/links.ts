import { site } from '../site.config';

const PARAMETROS_REPASSADOS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
] as const;

/** Link de cadastro com utm_*, gclid e fbclid da visita (`busca` = location.search). */
export function linkCadastro(busca: string, base: string = site.urls.cadastro): string {
  const origem = new URLSearchParams(busca);
  const url = new URL(base);
  for (const nome of PARAMETROS_REPASSADOS) {
    const valor = origem.get(nome);
    if (valor) url.searchParams.set(nome, valor);
  }
  return url.toString();
}

export function linkWhatsApp(numero: string, mensagem: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

export function linkEmail(email: string, assunto: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(assunto)}`;
}
