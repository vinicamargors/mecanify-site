import type { Consentimento } from './consentimento';

type Ids = { ga4: string; pixel: string; ads: string; adsLabel: string };

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[][] };
    _fbq?: unknown;
  }
}

const carregados = new Set<string>();
let estado = { analytics: false, marketing: false };
let pixelIniciado = false;

/** IDs injetados no HTML pelo build (`#config-rastreio`). Vazio = ferramenta desligada. */
export function lerIds(): Ids {
  const vazio: Ids = { ga4: '', pixel: '', ads: '', adsLabel: '' };
  try {
    const el = document.getElementById('config-rastreio');
    return { ...vazio, ...(el?.textContent ? JSON.parse(el.textContent) : {}) };
  } catch {
    return vazio;
  }
}

function injetar(src: string): void {
  if (carregados.has(src)) return;
  carregados.add(src);
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function carregarGtag(id: string): void {
  injetar(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
  if (!carregados.has(`config:${id}`)) {
    carregados.add(`config:${id}`);
    window.gtag('js', new Date());
    window.gtag('config', id);
  }
}

function iniciarPixel(id: string): void {
  if (!window.fbq) {
    const n = function (...a: unknown[]) {
      (n.queue as unknown[][]).push(a);
    } as NonNullable<Window['fbq']>;
    n.queue = [];
    window.fbq = n;
    window._fbq = n;
    injetar('https://connect.facebook.net/en_US/fbevents.js');
  }
  if (!pixelIniciado) {
    pixelIniciado = true;
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }
}

export function aplicarConsentimento(c: Pick<Consentimento, 'analytics' | 'marketing'>): void {
  const ids = lerIds();
  const concedido = (b: boolean) => (b ? 'granted' : 'denied');
  window.gtag?.('consent', 'update', {
    analytics_storage: concedido(c.analytics),
    ad_storage: concedido(c.marketing),
    ad_user_data: concedido(c.marketing),
    ad_personalization: concedido(c.marketing),
  });
  estado = { analytics: c.analytics, marketing: c.marketing };

  if (c.analytics && ids.ga4) carregarGtag(ids.ga4);
  if (c.marketing && ids.ads) carregarGtag(ids.ads);
  if (c.marketing && ids.pixel) {
    iniciarPixel(ids.pixel);
    window.fbq?.('consent', 'grant');
  }
  if (!c.marketing && window.fbq) window.fbq('consent', 'revoke');
}

/** Envia evento só se o visitante consentiu em alguma categoria. */
export function track(evento: string, params: Record<string, string> = {}): void {
  if (!estado.analytics && !estado.marketing) return;
  window.gtag?.('event', evento, params);
}

/** Clique delegado: CTAs de cadastro e entrada, WhatsApp e e-mail (`data-cta`, `data-evento`). */
export function iniciarEventos(): void {
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-cta], [data-evento]');
    if (!el) return;
    const { cta, evento, ctaOrigem } = el.dataset;
    if (cta === 'cadastro') {
      track('cta_cadastro', { origem: ctaOrigem ?? 'desconhecida' });
      registrarConversao();
    } else if (cta === 'entrar') {
      track('cta_entrar');
    } else if (evento) {
      track(evento);
    }
  });
}

function registrarConversao(): void {
  if (!estado.marketing) return;
  const ids = lerIds();
  if (ids.ads && ids.adsLabel) window.gtag?.('event', 'conversion', { send_to: `${ids.ads}/${ids.adsLabel}` });
  if (ids.pixel) window.fbq?.('track', 'Lead');
}
