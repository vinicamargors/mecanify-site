import { describe, expect, it } from 'vitest';
import { deveUsar3D } from '../../src/lib/dispositivo';

const bom = { webgl: true, reduzMovimento: false, nucleos: 8, memoriaGb: 8 };

describe('deveUsar3D', () => {
  it('aparelho bom usa 3D', () => expect(deveUsar3D(bom)).toBe(true));
  it('sem WebGL não usa', () => expect(deveUsar3D({ ...bom, webgl: false })).toBe(false));
  it('reduzir movimento não usa', () => expect(deveUsar3D({ ...bom, reduzMovimento: true })).toBe(false));
  it('4 núcleos ou menos não usa', () => expect(deveUsar3D({ ...bom, nucleos: 4 })).toBe(false));
  it('4 GB ou menos de memória não usa', () => expect(deveUsar3D({ ...bom, memoriaGb: 2 })).toBe(false));
  it('núcleos e memória desconhecidos não bloqueiam', () =>
    expect(deveUsar3D({ webgl: true, reduzMovimento: false })).toBe(true));
});
