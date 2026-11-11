/** Valor mensal equivalente do plano anual: paga 10 meses, usa 12, arredondado para baixo. */
export function precoAnualMensal(mensal: number): number {
  return Math.floor((mensal * 10) / 12);
}
