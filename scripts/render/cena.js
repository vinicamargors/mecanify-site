import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ROTEIROS } from './roteiro.js';

const params = new URLSearchParams(location.search);
const W = Number(params.get('w')) || 1200;
const H = Number(params.get('h')) || 1000;
const VARIANTE = params.get('variante') || 'desktop';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const cena = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
cena.environmentIntensity = 0.9;

const chave = new THREE.DirectionalLight(0xffffff, 1.6);
chave.position.set(4, 7, 6);
const contorno = new THREE.DirectionalLight(0xf5a524, 1.4);
contorno.position.set(-7, 4, -5);
const contorno2 = new THREE.DirectionalLight(0xf5a524, 0.8);
contorno2.position.set(7, 2, -4);
cena.add(chave, contorno, contorno2);

const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);

async function textura(url, flipY) {
  const t = await new THREE.TextureLoader().loadAsync(url);
  t.colorSpace = THREE.SRGBColorSpace;
  // O UV da tela do notebook foi feito invertido no Blender; o do iPhone segue a convenção glTF.
  t.flipY = flipY;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

const carregador = new GLTFLoader();
const [gNotebook, gCelular, texDesktop, texMobile] = await Promise.all([
  carregador.loadAsync('/modelos/notebook.glb'),
  carregador.loadAsync('/modelos/iphone.glb'),
  textura(params.get('texDesktop') || '/scripts/render/tela-desktop.png', true),
  textura(params.get('texMobile') || '/scripts/render/tela-mobile.png', false),
]);

// Telas: troca o material pelo print do sistema, sem tone mapping para a UI sair fiel.
function trocarTela(raiz, nomeMaterial, mapa) {
  let achou = false;
  raiz.traverse((o) => {
    if (o.isMesh && o.material?.name === nomeMaterial) {
      // O UV da tela nem sempre vai de 0 a 1: estica a textura para cobrir exatamente a faixa usada.
      const uv = o.geometry.attributes.uv;
      let [uMin, uMax, vMin, vMax] = [Infinity, -Infinity, Infinity, -Infinity];
      for (let i = 0; i < uv.count; i++) {
        uMin = Math.min(uMin, uv.getX(i));
        uMax = Math.max(uMax, uv.getX(i));
        vMin = Math.min(vMin, uv.getY(i));
        vMax = Math.max(vMax, uv.getY(i));
      }
      const t = mapa.clone();
      t.repeat.set(1 / (uMax - uMin), 1 / (vMax - vMin));
      t.offset.set(-uMin / (uMax - uMin), -vMin / (vMax - vMin));
      t.needsUpdate = true;
      console.log(nomeMaterial, 'uv', uMin.toFixed(3), uMax.toFixed(3), vMin.toFixed(3), vMax.toFixed(3));
      o.material = new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
      achou = true;
    }
    if (o.isMesh && o.material?.name === 'laptop.backlights') o.material.emissiveIntensity = 0.12;
  });
  if (!achou) throw new Error(`material ${nomeMaterial} não encontrado`);
}
trocarTela(gNotebook.scene, 'laptop.monitor', texDesktop);
trocarTela(gCelular.scene, 'screen', texMobile);

const notebook = new THREE.Group();
notebook.add(gNotebook.scene);
const tampa = gNotebook.scene.getObjectByName('monitor');
if (!tampa) throw new Error('nó monitor não encontrado');

const celular = new THREE.Group();
celular.add(gCelular.scene);
cena.add(notebook, celular);

function aplicar(p) {
  const r = ROTEIROS[VARIANTE](p);
  tampa.rotation.set(r.tampa, 0, 0);
  notebook.position.set(r.notebook.x, r.notebook.y, r.notebook.z);
  notebook.rotation.set(0, r.notebook.giro, 0);
  celular.position.set(r.celular.x, r.celular.y, r.celular.z);
  celular.rotation.set(0, r.celular.giro, r.celular.inclina);
  celular.scale.setScalar(r.celular.escala);
  camera.position.set(...r.camera.pos);
  camera.lookAt(...r.camera.alvo);
  camera.updateProjectionMatrix();
}

window.renderizar = (p) => {
  aplicar(p);
  renderer.render(cena, camera);
  return renderer.domElement.toDataURL('image/png');
};
window.pronto = true;
