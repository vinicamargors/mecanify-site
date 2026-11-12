# mecanify-site

Landing estática de `mecanify.com.br` (Astro + Tailwind 3). O sistema roda em `app.mecanify.com.br`.

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
| WhatsApp e e-mail | `src/site.config.ts` → `contato` | `whatsapp: '5511976608449'` |
| Preços e itens dos planos | `src/site.config.ts` → `planos` | `mensal: 197` |
| Google Analytics 4 | variável `PUBLIC_GA4_ID` na Vercel (Settings → Environment Variables) | `G-XXXXXXXXXX` |
| Meta Pixel | `PUBLIC_META_PIXEL_ID` | `123456789012345` |
| Google Ads | `PUBLIC_GOOGLE_ADS_ID` e `PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` | `AW-1234567890` / `AbC-D_efG-h12` |
| Textos legais | `src/content/legal/*.md`; após revisão jurídica, `revisado: true` | remove o aviso "Rascunho" |
| DNS | Vercel: `mecanify.com.br` e `www` neste projeto; `app.` no projeto do sistema | — |

Variável vazia = ferramenta desligada, sem erro. `npm run build` lista tudo que ainda falta. Em produção na Vercel (`VERCEL_ENV=production`), o build **falha** se algum valor de `src/site.config.ts` for `TODO_PREENCHER`; previews só avisam. A variável `PERMITIR_PLACEHOLDERS=1` libera esse bloqueio; não é mais necessária e pode ser apagada do projeto na Vercel.

## Regerar os prints do sistema

Os prints vêm do repo do sistema (`frontend-oficina-main`), tema escuro, dados simulados, em viewport 1440×900 e 390×844 com `deviceScaleFactor: 2`. Salve `<tela>-<largura>.png` (telas: `radar ordens estoque financeiro equipe`; larguras: `1440 390`) numa pasta e rode:

```bash
node scripts/importar-prints.mjs <pasta-com-prints>
```

O script grava AVIF e WebP em `src/assets/telas/`. Confira que nenhum print mostra dados de cliente real.

## Créditos e licenças

- Fundo animado do site: port do "Cursor Ring Field" da Originkit (uso licenciado), em `src/components/FundoAneis.ts`.

## Sequência de quadros do hero

O notebook e o celular do hero são uma sequência de imagens (WebP com transparência) desenhada num `<canvas>` conforme a rolagem, no estilo das páginas de produto da Apple. Os quadros são renderizados a partir dos modelos em `modelos/*.glb` (Three.js em navegador sem tela) e ficam em `public/hero/seq/{desktop,celular}/`.

```bash
node scripts/render-sequencia.mjs                    # gera todos os quadros (~2 min)
node scripts/render-sequencia.mjs --teste <pasta>    # só 3 quadros de cada variante, em PNG, para conferir
```

- O roteiro (posições, giros e câmera por progresso) fica em `scripts/render/roteiro.js`.
- Quantidade e tamanho dos quadros: `src/lib/sequencia.json` (lido pelo site e pelo render).
- As telas dos aparelhos usam `scripts/render/tela-desktop.png` e `tela-mobile.png` (prints do sistema).
- Modelos: `modelos/notebook.glb` e `modelos/iphone.glb` (origem e licença a confirmar).
