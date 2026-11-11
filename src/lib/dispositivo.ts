export type Ambiente = {
  webgl: boolean;
  reduzMovimento: boolean;
  nucleos?: number;
  memoriaGb?: number;
};

/**
 * Decide se o hero usa 3D. Dados ausentes não bloqueiam. A cena é leve (poucos polígonos), então só ficam
 * de fora: sem WebGL, "reduzir movimento", 2 núcleos ou menos, ou 1 GB de memória ou menos.
 * (Chrome de celular costuma reportar 4 GB e muito notebook tem 4 núcleos: esses recebem o 3D.)
 */
export function deveUsar3D(amb: Ambiente): boolean {
  if (!amb.webgl || amb.reduzMovimento) return false;
  if (amb.nucleos !== undefined && amb.nucleos <= 2) return false;
  if (amb.memoriaGb !== undefined && amb.memoriaGb <= 1) return false;
  return true;
}
