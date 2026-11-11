// Roteiro da animação do hero: pose de cada objeto e da câmera para um progresso p (0..1).
// Desktop (paisagem): notebook em 3/4 abre a tampa e vira de frente; o celular sobe e gira até mostrar a tela.
// Celular (retrato): notebook em cima, celular grande à frente, embaixo.

const limitar = (v) => Math.min(Math.max(v, 0), 1);
const suave = (t) => {
  const x = limitar(t);
  return x * x * (3 - 2 * x);
};
const lerp = (a, b, t) => a + (b - a) * t;
const faixa = (p, ini, fim) => suave((p - ini) / (fim - ini));

export const ROTEIROS = {
  desktop: (p) => {
    const abre = faixa(p, 0, 0.45);
    const vira = faixa(p, 0, 1);
    const entra = faixa(p, 0.3, 0.85);
    const aproxima = faixa(p, 0.5, 1);
    return {
      tampa: lerp(-1.2, -1.83, abre),
      notebook: { x: lerp(0.15, -0.5, entra), y: 0, z: 0, giro: lerp(-0.6, -0.12, vira) },
      celular: {
        x: lerp(2.9, 2.1, entra),
        y: lerp(-3.2, 0.05, entra),
        z: 1.5,
        giro: lerp(Math.PI + 0.9, -0.35, entra),
        inclina: lerp(0.25, 0.04, entra),
        escala: 1.25,
      },
      camera: {
        pos: [lerp(0.8, 0.6, aproxima), lerp(2.6, 2.0, aproxima), lerp(11.5, 10.2, aproxima)],
        alvo: [0.6, lerp(0.75, 0.95, aproxima), 0],
      },
    };
  },
  // Celular: câmera colada nos aparelhos (podem sair da borda). Começa no notebook, que preenche a tela,
  // e termina com o iPhone grande à frente, legível.
  celular: (p) => {
    const abre = faixa(p, 0, 0.4);
    const vira = faixa(p, 0, 1);
    const entra = faixa(p, 0.3, 0.85);
    const desce = faixa(p, 0.25, 1);
    return {
      tampa: lerp(-1.2, -1.83, abre),
      notebook: { x: 0, y: 0.6, z: -1.2, giro: lerp(-0.55, -0.2, vira) },
      celular: {
        x: lerp(1.4, 0.45, entra),
        y: lerp(-5.5, -2.15, entra),
        z: 2.6,
        giro: lerp(Math.PI + 0.9, -0.18, entra),
        inclina: lerp(0.25, 0.02, entra),
        escala: 1.75,
      },
      camera: {
        pos: [lerp(0.2, 0.35, desce), lerp(3.1, 0.9, desce), lerp(8.2, 8.6, desce)],
        alvo: [lerp(-0.1, 0.35, desce), lerp(2.0, -0.2, desce), 0],
      },
    };
  },
};
