export type Ambiente = {
  reduzMovimento: boolean;
  nucleos?: number;
  memoriaGb?: number;
};

/**
 * Decide se o hero anima (sequência presa na rolagem e fundo em movimento). Dados ausentes não bloqueiam.
 * Ficam de fora: "reduzir movimento", 2 núcleos ou menos, ou 1 GB de memória ou menos.
 * (Chrome de celular costuma reportar 4 GB e muito notebook tem 4 núcleos: esses animam.)
 */
export function deveAnimar(amb: Ambiente): boolean {
  if (amb.reduzMovimento) return false;
  if (amb.nucleos !== undefined && amb.nucleos <= 2) return false;
  if (amb.memoriaGb !== undefined && amb.memoriaGb <= 1) return false;
  return true;
}
