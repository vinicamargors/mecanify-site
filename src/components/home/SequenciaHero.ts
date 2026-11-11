// Player da sequência de quadros do hero (estilo páginas de produto da Apple):
// desenha no <canvas> o quadro que corresponde ao progresso da rolagem.

export type OpcoesSequencia = {
  /** Pasta dos quadros, sem barra no fim. Arquivos 000.webp, 001.webp... */
  base: string;
  total: number;
  /** Progresso da rolagem, 0..1. */
  progresso: () => number;
  /** Só o último quadro, sem acompanhar a rolagem (reduzir movimento). */
  estatico: boolean;
  aoPrimeiroQuadro?: () => void;
};

const CONCORRENCIA = 6;
/** Fração do caminho até o quadro-alvo percorrida a cada frame: suaviza saltos de rolagem. */
const SUAVIZACAO = 0.3;

const url = (base: string, i: number) => `${base}/${String(i).padStart(3, '0')}.webp`;

/** Ordem de carga: primeiro e último, depois metades sucessivas — a animação fica "grossa" cedo e refina. */
export function ordemDeCarga(total: number): number[] {
  const ordem: number[] = [0];
  if (total > 1) ordem.push(total - 1);
  const visto = new Set(ordem);
  for (let passo = 2 ** Math.ceil(Math.log2(Math.max(total, 2))); passo >= 1; passo /= 2) {
    for (let i = 0; i < total; i += passo) {
      if (!visto.has(i)) {
        visto.add(i);
        ordem.push(i);
      }
    }
  }
  return ordem;
}

export function montarSequencia(canvas: HTMLCanvasElement, op: OpcoesSequencia): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('sem canvas 2D');
  const imagens: (HTMLImageElement | null)[] = new Array(op.total).fill(null);
  let carregados = 0;
  let desmontado = false;
  let alvoAtual = op.estatico ? op.total - 1 : 0;
  let quadroSuave = alvoAtual;
  let desenhado = -1;
  let primeiro = true;
  let raf = 0;
  let visivel = true;

  function redimensionar(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      desenhado = -1;
    }
  }

  /** Índice carregado mais próximo do pedido (enquanto a sequência ainda baixa). */
  function maisProximo(i: number): number {
    for (let d = 0; d < op.total; d++) {
      if (i - d >= 0 && imagens[i - d]) return i - d;
      if (i + d < op.total && imagens[i + d]) return i + d;
    }
    return -1;
  }

  function desenhar(i: number): void {
    const j = maisProximo(i);
    if (j < 0 || j === desenhado) return;
    const img = imagens[j]!;
    const escala = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth * escala;
    const h = img.naturalHeight * escala;
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    ctx!.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    desenhado = j;
    canvas.dataset.quadro = String(j);
    if (primeiro) {
      primeiro = false;
      op.aoPrimeiroQuadro?.();
    }
  }

  function quadro(): void {
    raf = 0;
    if (desmontado) return;
    if (!op.estatico) {
      alvoAtual = Math.round(Math.min(Math.max(op.progresso(), 0), 1) * (op.total - 1));
      quadroSuave += (alvoAtual - quadroSuave) * SUAVIZACAO;
      if (Math.abs(alvoAtual - quadroSuave) < 0.5) quadroSuave = alvoAtual;
    }
    redimensionar();
    desenhar(Math.round(quadroSuave));
    agendar();
  }

  function agendar(): void {
    if (!raf && !desmontado && visivel && !document.hidden) raf = requestAnimationFrame(quadro);
  }

  async function carregar(i: number): Promise<void> {
    const img = new Image();
    img.decoding = 'async';
    img.src = url(op.base, i);
    try {
      await img.decode();
    } catch {
      return; // quadro que falhou fica de fora; o vizinho mais próximo cobre
    }
    if (desmontado) return;
    imagens[i] = img;
    carregados++;
    canvas.dataset.carregados = String(carregados);
    desenhado = -1; // um quadro mais próximo do alvo pode ter chegado
    agendar();
  }

  const fila = op.estatico ? [op.total - 1] : ordemDeCarga(op.total);
  let proximo = 0;
  const trabalhador = async () => {
    while (!desmontado && proximo < fila.length) await carregar(fila[proximo++]);
  };
  for (let k = 0; k < CONCORRENCIA; k++) void trabalhador();

  const io = new IntersectionObserver((es) => {
    visivel = es[es.length - 1].isIntersecting;
    agendar();
  });
  io.observe(canvas);
  document.addEventListener('visibilitychange', agendar);
  canvas.dataset.carregados = '0';
  agendar();

  return () => {
    desmontado = true;
    cancelAnimationFrame(raf);
    io.disconnect();
    document.removeEventListener('visibilitychange', agendar);
  };
}
