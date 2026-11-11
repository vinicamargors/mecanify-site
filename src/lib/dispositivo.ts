export type Ambiente = {
  webgl: boolean;
  reduzMovimento: boolean;
  nucleos?: number;
  memoriaGb?: number;
};

/** Decide se o hero usa 3D. Dados ausentes não bloqueiam; aparelho fraco, sem WebGL ou com reduzir movimento, sim. */
export function deveUsar3D(amb: Ambiente): boolean {
  if (!amb.webgl || amb.reduzMovimento) return false;
  if (amb.nucleos !== undefined && amb.nucleos <= 4) return false;
  if (amb.memoriaGb !== undefined && amb.memoriaGb <= 4) return false;
  return true;
}
