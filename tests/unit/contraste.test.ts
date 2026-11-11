import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type Rgb = [number, number, number];

const css = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');

function tokens(): Record<string, Rgb> {
  const m = css.match(/:root\s*\{([^}]*)\}/);
  if (!m) throw new Error('bloco :root não encontrado em tokens.css');
  const out: Record<string, Rgb> = {};
  for (const [, nome, r, g, b] of m[1].matchAll(/--c-([a-z-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) {
    out[nome] = [Number(r), Number(g), Number(b)];
  }
  return out;
}

function luminancia([r, g, b]: Rgb): number {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function razao(a: Rgb, b: Rgb): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

describe('contraste (escuro fixo)', () => {
  const t = tokens();
  const par = (fg: string, bg: string, min: number) =>
    it(`${fg} sobre ${bg} >= ${min}`, () => {
      expect(t[fg], `token ${fg}`).toBeDefined();
      expect(t[bg], `token ${bg}`).toBeDefined();
      expect(razao(t[fg], t[bg])).toBeGreaterThanOrEqual(min);
    });

  for (const fg of ['ink', 'ink-muted', 'ink-subtle', 'brand-ink']) {
    for (const bg of ['canvas', 'surface']) par(fg, bg, 4.5);
  }
  par('on-brand', 'brand', 4.5);
  par('on-brand', 'brand-hover', 4.5);
  par('line-strong', 'sunken', 3);
});
