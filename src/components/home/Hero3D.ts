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

  function ajustar(): void {
    const w = Math.max(1, alvo.clientWidth);
    const h = Math.max(1, alvo.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Afasta a câmera em telas estreitas para a cena caber na largura.
    const distancia = 8.7 * Math.max(1, 1.25 / camera.aspect);
    camera.position.set(0.15, 1.0, distancia);
    camera.lookAt(0.25, 0.5, 0);
    camera.updateProjectionMatrix();
    if (opcoes.estatico) renderer.render(cena, camera);
  }

  let giroScroll = 0;

  function atualizarScroll(): void {
    const r = alvo.getBoundingClientRect();
    giroScroll = MathUtils.clamp(-r.top / Math.max(1, r.height), 0, 1) * 10 * GRAUS;
  }

  function aoPonteiro(e: PointerEvent): void {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    alvoRot.y = nx * 6 * GRAUS;
    alvoRot.x = ny * 3 * GRAUS;
  }

  function desenhar(): void {
    quadro = 0;
    if (desmontado || !visivel || document.hidden) return;
    atualizarScroll();
    rot.x = MathUtils.lerp(rot.x, alvoRot.x, 0.08);
    rot.y = MathUtils.lerp(rot.y, alvoRot.y, 0.08);
    raiz.rotation.x = rot.x;
    raiz.rotation.y = -0.2 + rot.y + giroScroll;
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
      raiz.rotation.y = -0.2;
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
