import { describe, expect, it } from 'vitest';
import { deveAnimar } from '../../src/lib/dispositivo';

const bom = { reduzMovimento: false, nucleos: 8, memoriaGb: 8 };

describe('deveAnimar', () => {
  it('aparelho bom anima', () => expect(deveAnimar(bom)).toBe(true));
  it('reduzir movimento não anima', () => expect(deveAnimar({ ...bom, reduzMovimento: true })).toBe(false));
  it('celular e notebook comuns (4 núcleos, 4 GB) animam', () =>
    expect(deveAnimar({ ...bom, nucleos: 4, memoriaGb: 4 })).toBe(true));
  it('2 núcleos ou menos não anima', () => expect(deveAnimar({ ...bom, nucleos: 2 })).toBe(false));
  it('1 GB ou menos de memória não anima', () => expect(deveAnimar({ ...bom, memoriaGb: 1 })).toBe(false));
  it('núcleos e memória desconhecidos não bloqueiam', () => expect(deveAnimar({ reduzMovimento: false })).toBe(true));
});
