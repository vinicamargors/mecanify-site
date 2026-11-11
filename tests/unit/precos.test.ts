import { describe, expect, it } from 'vitest';
import { precoAnualMensal } from '../../src/lib/precos';

describe('precoAnualMensal', () => {
  it('paga 10 meses e usa 12, arredondando para baixo', () => {
    expect([97, 197, 347].map(precoAnualMensal)).toEqual([80, 164, 289]);
  });
});
