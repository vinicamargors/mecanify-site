import { describe, expect, it } from 'vitest';
import { ordemDeCarga } from '../../src/components/home/SequenciaHero';

describe('ordemDeCarga', () => {
  it('começa pelo primeiro e pelo último e cobre todos os quadros uma vez', () => {
    const ordem = ordemDeCarga(120);
    expect(ordem.slice(0, 2)).toEqual([0, 119]);
    expect(new Set(ordem).size).toBe(120);
    expect(ordem.length).toBe(120);
  });

  it('carrega o meio antes dos vizinhos', () => {
    const ordem = ordemDeCarga(9);
    expect(ordem.indexOf(4)).toBeLessThan(ordem.indexOf(1));
  });
});
