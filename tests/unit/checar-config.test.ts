import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

function rodar(env: Record<string, string>) {
  return spawnSync('node', ['scripts/checar-config.mjs'], {
    env: { PATH: process.env.PATH ?? '', ...env },
    encoding: 'utf8',
  });
}

describe('checar-config', () => {
  it('fora de produção só avisa dos placeholders', () => {
    const r = rodar({});
    expect(r.status).toBe(0);
    expect(r.stderr).toContain('Antes de publicar');
  });

  it('em produção na Vercel, placeholder de contato/empresa falha o build', () => {
    const r = rodar({ VERCEL_ENV: 'production' });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('whatsapp');
  });

  it('PERMITIR_PLACEHOLDERS=1 libera o build de produção e ainda avisa', () => {
    const r = rodar({ VERCEL_ENV: 'production', PERMITIR_PLACEHOLDERS: '1' });
    expect(r.status).toBe(0);
    expect(r.stderr).toContain('PERMITIR_PLACEHOLDERS');
  });

  it('preview da Vercel continua só avisando', () => {
    expect(rodar({ VERCEL_ENV: 'preview' }).status).toBe(0);
  });
});
