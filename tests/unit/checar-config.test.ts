import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Config de teste com um placeholder: o site real já está preenchido.
const pasta = mkdtempSync(join(tmpdir(), 'checar-config-'));
const comPlaceholder = join(pasta, 'site.config.ts');
writeFileSync(comPlaceholder, "export const site = {\n  contato: {\n    whatsapp: 'TODO_PREENCHER',\n  },\n};\n");

function rodar(env: Record<string, string>, arquivo = comPlaceholder) {
  return spawnSync('node', ['scripts/checar-config.mjs'], {
    env: { PATH: process.env.PATH ?? '', CHECAR_CONFIG_ARQUIVO: arquivo, ...env },
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

  it('a config real do site não tem placeholders: produção passa', () => {
    const r = rodar({ VERCEL_ENV: 'production' }, 'src/site.config.ts');
    expect(r.status).toBe(0);
    expect(r.stderr).not.toContain('site.config.ts:');
  });

  it('preview da Vercel continua só avisando', () => {
    expect(rodar({ VERCEL_ENV: 'preview' }).status).toBe(0);
  });
});
