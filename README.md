# mecanify-site

Landing estática de `mecanify.com.br` (Astro + Tailwind 3 + Three.js). O sistema roda em `app.mecanify.com.br`.

```bash
npm install
npm run dev      # http://localhost:4321
npm test         # testes unitários
npm run build    # gera dist/ e lista pendências
npm run e2e      # testes de navegador (precisa de build)
```

## Antes de publicar

| Item | Onde editar | Exemplo |
|---|---|---|
| WhatsApp, e-mail, CNPJ, razão social | `src/site.config.ts` (valores `TODO_PREENCHER`) | `whatsapp: '5511999999999'` |
| Preços e itens dos planos | `src/site.config.ts` → `planos` | `mensal: 197` |
| Google Analytics 4 | variável `PUBLIC_GA4_ID` na Vercel (Settings → Environment Variables) | `G-XXXXXXXXXX` |
| Meta Pixel | `PUBLIC_META_PIXEL_ID` | `123456789012345` |
| Google Ads | `PUBLIC_GOOGLE_ADS_ID` e `PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` | `AW-1234567890` / `AbC-D_efG-h12` |
| Textos legais | `src/content/legal/*.md`; após revisão jurídica, `revisado: true` | remove o aviso "Rascunho" |
| DNS | Vercel: `mecanify.com.br` e `www` neste projeto; `app.` no projeto do sistema | — |

Variável vazia = ferramenta desligada, sem erro. `npm run build` lista tudo que ainda falta. Em produção na Vercel (`VERCEL_ENV=production`), o build **falha** se WhatsApp, e-mail, CNPJ ou razão social ainda forem `TODO_PREENCHER`; previews só avisam.

## Regerar os prints do sistema

Os prints vêm do repo do sistema (`frontend-oficina-main`), tema escuro, dados simulados, em viewport 1440×900 e 390×844 com `deviceScaleFactor: 2`. Salve `<tela>-<largura>.png` (telas: `radar ordens estoque financeiro equipe`; larguras: `1440 390`) numa pasta e rode:

```bash
node scripts/importar-prints.mjs <pasta-com-prints>
```

O script grava AVIF e WebP em `src/assets/telas/`. Confira que nenhum print mostra dados de cliente real.
