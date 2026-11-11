import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({
    titulo: z.string(),
    descricao: z.string(),
    atualizadoEm: z.coerce.date(),
    /** `true` só depois da revisão jurídica: remove o aviso de rascunho. */
    revisado: z.boolean().default(false),
  }),
});

export const collections = { legal };
