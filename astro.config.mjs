import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { site as config } from './src/site.config.ts';
import { remarkDados } from './src/lib/remark-dados.mjs';

export default defineConfig({
  site: 'https://mecanify.com.br',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkDados({
          razaoSocial: config.empresa.razaoSocial,
          cnpj: config.empresa.cnpj,
          email: config.contato.email,
        }),
      ],
    }),
  },
});
