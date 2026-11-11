import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Scene,
  Texture,
  TextureLoader,
  Vector3,
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
  const contorno = new DirectionalLight(0xf5a524, 1.6);
  contorno.position.set(-4, 3, -3);
  cena.add(chave, contorno);

  const raiz = new Group();
  cena.add(raiz);

  const geometrias: BufferGeometry[] = [];
  const materiais: Material[] = [];
  const geo = <T extends BufferGeometry>(g: T): T => (geometrias.push(g), g);
  const mat = <T extends Material>(m: T): T => (materiais.push(m), m);

  const aluminio = mat(new MeshStandardMaterial({ color: 0xa3a7b2, metalness: 0.4, roughness: 0.4 }));
  const grafite = mat(new MeshStandardMaterial({ color: 0x3d3f46, metalness: 0.35, roughness: 0.5 }));
  const poco = mat(new MeshStandardMaterial({ color: 0x08080a, roughness: 0.9 }));
  const tecla = mat(new MeshStandardMaterial({ color: 0x2b2d33, roughness: 0.5, metalness: 0.1 }));
  const trackpadMat = mat(new MeshStandardMaterial({ color: 0x9396a0, metalness: 0.5, roughness: 0.3 }));
  const moldura = mat(new MeshBasicMaterial({ color: 0x050506 }));
  const telaNotebook = mat(new MeshBasicMaterial({ color: 0x0e0f11 }));
  const telaCelular = mat(new MeshBasicMaterial({ color: 0x0e0f11 }));

  const notebook = new Group();
  notebook.position.set(-0.55, -0.4, 0);

  // Base: chassi, poço do teclado, teclas, trackpad e dobradiça.
  notebook.add(new Mesh(geo(new RoundedBoxGeometry(3.4, 0.09, 2.2, 3, 0.04)), aluminio));
  const pocoTeclado = new Mesh(geo(new BoxGeometry(3.0, 0.012, 1.2)), poco);
  pocoTeclado.position.set(0, 0.048, -0.4);
  notebook.add(pocoTeclado);

  // Teclas: 4 fileiras de 14, fileira de funções mais baixa, barra de espaço e teclas laterais.
  const posicoes: { x: number; z: number; sx: number; sz: number }[] = [];
  for (let c = 0; c < 14; c++) posicoes.push({ x: -1.3 + c * 0.2, z: -0.88, sx: 1, sz: 0.7 });
  [-0.7, -0.52, -0.34, -0.16].forEach((z) => {
    for (let c = 0; c < 14; c++) posicoes.push({ x: -1.3 + c * 0.2, z, sx: 1, sz: 1 });
  });
  [-1.3, -1.1, -0.9, -0.7].forEach((x) => posicoes.push({ x, z: 0.02, sx: 1, sz: 1 }));
  posicoes.push({ x: -0.02, z: 0.02, sx: 5.4, sz: 1 });
  [0.8, 1.0, 1.2].forEach((x) => posicoes.push({ x, z: 0.02, sx: 1, sz: 1 }));
  const teclas = new InstancedMesh(geo(new BoxGeometry(0.17, 0.03, 0.15)), tecla, posicoes.length);
  const m4 = new Matrix4();
  posicoes.forEach((k, i) => {
    m4.compose(new Vector3(k.x, 0.068, k.z), new Quaternion(), new Vector3(k.sx, 1, k.sz));
    teclas.setMatrixAt(i, m4);
  });
  teclas.instanceMatrix.needsUpdate = true;
  notebook.add(teclas);

  const trackpad = new Mesh(geo(new RoundedBoxGeometry(1.25, 0.008, 0.66, 2, 0.03)), trackpadMat);
  trackpad.position.set(0, 0.049, 0.74);
  notebook.add(trackpad);

  const dobradica = new Mesh(geo(new CylinderGeometry(0.05, 0.05, 3.0, 16)), grafite);
  dobradica.rotation.z = Math.PI / 2;
  dobradica.position.set(0, 0.07, -1.1);
  notebook.add(dobradica);

  // Tampa: casco de alumínio, moldura preta, tela e webcam.
  const tampa = new Group();
  tampa.position.set(0, 0.05, -1.1);
  tampa.rotation.x = -0.18;
  const corpoTampa = new Mesh(geo(new RoundedBoxGeometry(3.4, 2.2, 0.06, 3, 0.04)), aluminio);
  corpoTampa.position.y = 1.1;
  const planoMoldura = new Mesh(geo(new PlaneGeometry(3.3, 2.1)), moldura);
  planoMoldura.position.set(0, 1.1, 0.031);
  const planoN = new Mesh(geo(new PlaneGeometry(3.14, 1.96)), telaNotebook);
  planoN.position.set(0, 1.08, 0.032);
  const webcam = new Mesh(geo(new CircleGeometry(0.025, 16)), mat(new MeshBasicMaterial({ color: 0x1d2230 })));
  webcam.position.set(0, 2.13, 0.033);
  tampa.add(corpoTampa, planoMoldura, planoN, webcam);
  notebook.add(tampa);

  const geoCelular = geo(new RoundedBoxGeometry(0.82, 1.7, 0.08, 3, 0.1));
  const geoTelaC = geo(new PlaneGeometry(0.74, 1.6));

  const celular = new Group();
  celular.position.set(1.6, -0.4, 0.9);
  celular.rotation.y = -0.35;
  const corpoCelular = new Mesh(geoCelular, grafite);
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
    camera.position.set(MathUtils.lerp(0.15, 0.05, t2), MathUtils.lerp(2.6, 2.3, t2), distanciaBase * MathUtils.lerp(1, 0.84, t2));
    camera.lookAt(MathUtils.lerp(0.25, 0.05, t2), MathUtils.lerp(0.3, 0.6, t2), 0);
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
    teclas.dispose();
    geometrias.forEach((g) => g.dispose());
    materiais.forEach((m) => {
      (m as MeshBasicMaterial).map?.dispose();
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
