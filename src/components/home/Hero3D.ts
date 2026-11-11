import {
  AmbientLight,
  DirectionalLight,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  Texture,
  TextureLoader,
  WebGLRenderer,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type Texturas = { desktop: string; mobile: string };
export type OpcoesHero = {
  /** Pose fixa, um único quadro (usado para gerar a imagem de fallback). */
  estatico?: boolean;
  aoPrimeiroQuadro?: () => void;
  /** Textura não carregou ou o contexto WebGL foi perdido. */
  aoFalhar?: () => void;
};

const GRAUS = Math.PI / 180;
const DURACAO_ABERTURA_MS = 1000;

const limitar = (v: number) => MathUtils.clamp(v, 0, 1);
/** Suaviza 0..1 (começo e fim lentos). */
const suave = (t: number) => limitar(t) * limitar(t) * (3 - 2 * limitar(t));

function carregar(url: string): Promise<Texture> {
  return new Promise((resolve, reject) => {
    new TextureLoader().load(
      url,
      (t) => {
        t.colorSpace = SRGBColorSpace;
        t.anisotropy = 4;
        resolve(t);
      },
      undefined,
      reject,
    );
  });
}

/** Monta notebook + celular em `alvo`. Devolve a função que desmonta tudo. Lança se não houver WebGL. */
export function montarHero(alvo: HTMLElement, texturas: Texturas, opcoes: OpcoesHero = {}): () => void {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.cssText = 'display:block;width:100%;height:100%';
  alvo.appendChild(canvas);

  const cena = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  cena.add(new AmbientLight(0xffffff, 1.4));
  const chave = new DirectionalLight(0xffffff, 1.6);
  chave.position.set(2, 4, 5);
  const contorno = new DirectionalLight(0xf5a524, 3);
  contorno.position.set(-4, 3, -3);
  cena.add(chave, contorno);

  const raiz = new Group();
  cena.add(raiz);

  const corpo = new MeshStandardMaterial({ color: 0x3d3f46, metalness: 0.35, roughness: 0.5 });
  const telaNotebook = new MeshBasicMaterial({ color: 0x0e0f11 });
  const telaCelular = new MeshBasicMaterial({ color: 0x0e0f11 });

  const geometrias = [
    new RoundedBoxGeometry(3.4, 0.1, 2.2, 3, 0.04),
    new RoundedBoxGeometry(3.4, 2.2, 0.07, 3, 0.04),
    new PlaneGeometry(3.2, 2.0),
    new RoundedBoxGeometry(0.82, 1.7, 0.08, 3, 0.1),
    new PlaneGeometry(0.74, 1.6),
  ];
  const [geoBase, geoTampa, geoTelaN, geoCelular, geoTelaC] = geometrias;

  const notebook = new Group();
  notebook.position.set(-0.55, -0.4, 0);
  notebook.add(new Mesh(geoBase, corpo));
  const tampa = new Group();
  tampa.position.set(0, 0.05, -1.1);
  tampa.rotation.x = -0.18;
  const corpoTampa = new Mesh(geoTampa, corpo);
  corpoTampa.position.y = 1.1;
  const planoN = new Mesh(geoTelaN, telaNotebook);
  planoN.position.set(0, 1.1, 0.037);
  tampa.add(corpoTampa, planoN);
  notebook.add(tampa);

  const celular = new Group();
  celular.position.set(1.6, -0.4, 0.9);
  celular.rotation.y = -0.35;
  const corpoCelular = new Mesh(geoCelular, corpo);
  corpoCelular.position.y = 0.85;
  const planoC = new Mesh(geoTelaC, telaCelular);
  planoC.position.set(0, 0.85, 0.041);
  celular.add(corpoCelular, planoC);

  raiz.add(notebook, celular);

  let desmontado = false;
  let visivel = true;
  let quadro = 0;
  const alvoRot = { x: 0, y: 0 };
  const rot = { x: 0, y: 0 };

  let distanciaBase = 8.7;
  let pronto = false;

  function posicionarCamera(t2: number): void {
    camera.position.set(MathUtils.lerp(0.15, 0.05, t2), MathUtils.lerp(1.0, 1.1, t2), distanciaBase * MathUtils.lerp(1, 0.84, t2));
    camera.lookAt(MathUtils.lerp(0.25, 0.05, t2), MathUtils.lerp(0.5, 0.8, t2), 0);
  }

  function ajustar(): void {
    const w = Math.max(1, alvo.clientWidth);
    const h = Math.max(1, alvo.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Afasta a câmera em telas estreitas para a cena caber na largura.
    distanciaBase = 8.7 * Math.max(1, 1.25 / camera.aspect);
    posicionarCamera(opcoes.estatico ? 0 : t2Atual);
    camera.updateProjectionMatrix();
    // setSize limpa o canvas: redesenha já, senão o hero pisca até o próximo quadro.
    if (pronto) renderer.render(cena, camera);
  }

  const palco = alvo.closest<HTMLElement>('[data-hero-palco]');
  const fixo = palco?.querySelector<HTMLElement>('[data-hero-fixo]') ?? null;
  const consultaPreso = matchMedia('(min-width: 1024px)');
  let t2Atual = 0;

  /** 0..1. Preso (desktop): avança com a rolagem do palco. Solto (celular): fase 2 acompanha a saída do hero. */
  function calcularProgresso(): number {
    if (opcoes.estatico) return 0.5;
    if (palco && fixo && consultaPreso.matches && document.documentElement.hasAttribute('data-hero3d')) {
      const topo = parseFloat(getComputedStyle(fixo).top) || 0;
      const curso = Math.max(1, palco.offsetHeight - fixo.offsetHeight);
      return limitar((topo - palco.getBoundingClientRect().top) / curso);
    }
    const r = alvo.getBoundingClientRect();
    return 0.5 + limitar(-r.top / Math.max(1, r.height)) * 0.5;
  }

  let inicioAbertura = 0;

  function abertura(agora: number): number {
    if (opcoes.estatico) return 1;
    if (!inicioAbertura) inicioAbertura = agora;
    return suave((agora - inicioAbertura) / DURACAO_ABERTURA_MS);
  }

  /** Fase 1 (0–50%): celular sobe e gira. Fase 2 (50–100%): câmera se aproxima e o conjunto gira. */
  function aplicarPose(p: number, aberta: number): void {
    const t1 = suave(p / 0.5);
    const t2 = suave((p - 0.5) / 0.5);
    t2Atual = t2;
    tampa.rotation.x = MathUtils.lerp(Math.PI / 2, -0.18, aberta);
    tampa.position.y = MathUtils.lerp(0.1, 0.05, aberta);
    celular.position.y = MathUtils.lerp(-1.25, -0.4, t1);
    celular.rotation.y = -0.35 + (1 - t1) * 0.9;
    raiz.rotation.x = rot.x;
    raiz.rotation.y = -0.2 + rot.y + t2 * 20 * GRAUS;
    posicionarCamera(t2);
    camera.updateProjectionMatrix();
    alvo.dataset.progresso = p.toFixed(3);
    alvo.dataset.abertura = aberta.toFixed(3);
  }

  function aoPonteiro(e: PointerEvent): void {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    alvoRot.y = nx * 6 * GRAUS;
    alvoRot.x = ny * 3 * GRAUS;
  }

  function desenhar(agora: number): void {
    quadro = 0;
    if (desmontado || !visivel || document.hidden) return;
    rot.x = MathUtils.lerp(rot.x, alvoRot.x, 0.08);
    rot.y = MathUtils.lerp(rot.y, alvoRot.y, 0.08);
    aplicarPose(calcularProgresso(), abertura(agora));
    renderer.render(cena, camera);
    quadro = requestAnimationFrame(desenhar);
  }

  function retomar(): void {
    if (!quadro && !desmontado && !opcoes.estatico) quadro = requestAnimationFrame(desenhar);
  }

  const observadorTamanho = new ResizeObserver(ajustar);
  const observadorVisibilidade = new IntersectionObserver((es) => {
    visivel = es[es.length - 1].isIntersecting;
    if (visivel) retomar();
  });

  function desmontar(): void {
    if (desmontado) return;
    desmontado = true;
    cancelAnimationFrame(quadro);
    observadorTamanho.disconnect();
    observadorVisibilidade.disconnect();
    window.removeEventListener('pointermove', aoPonteiro);
    document.removeEventListener('visibilitychange', retomar);
    canvas.removeEventListener('webglcontextlost', aoPerderContexto);
    geometrias.forEach((g) => g.dispose());
    [corpo, telaNotebook, telaCelular].forEach((m) => {
      m.map?.dispose();
      m.dispose();
    });
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }

  function aoPerderContexto(e: Event): void {
    e.preventDefault();
    desmontar();
    opcoes.aoFalhar?.();
  }

  canvas.addEventListener('webglcontextlost', aoPerderContexto);
  ajustar();
  observadorTamanho.observe(alvo);

  Promise.all([carregar(texturas.desktop), carregar(texturas.mobile)])
    .then(([tDesktop, tMobile]) => {
      if (desmontado) {
        tDesktop.dispose();
        tMobile.dispose();
        return;
      }
      telaNotebook.map = tDesktop;
      telaNotebook.color.set(0xffffff);
      telaNotebook.needsUpdate = true;
      telaCelular.map = tMobile;
      telaCelular.color.set(0xffffff);
      telaCelular.needsUpdate = true;
      aplicarPose(calcularProgresso(), opcoes.estatico ? 1 : 0);
      pronto = true;
      renderer.render(cena, camera);
      opcoes.aoPrimeiroQuadro?.();
      if (!opcoes.estatico) {
        window.addEventListener('pointermove', aoPonteiro, { passive: true });
        document.addEventListener('visibilitychange', retomar);
        observadorVisibilidade.observe(alvo);
        retomar();
      }
    })
    .catch(() => {
      desmontar();
      opcoes.aoFalhar?.();
    });

  return desmontar;
}
