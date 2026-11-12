/**
 * Dados editáveis da landing. Um valor `TODO_PREENCHER` bloqueia o build de produção (ver README).
 * IDs de rastreio NÃO ficam aqui: use as variáveis PUBLIC_* (ver .env.example).
 */
export type PlanoId = 'bancada' | 'patio-pro' | 'oficina-full';

export type Plano = {
  id: PlanoId;
  nome: string;
  paraQuem: string;
  mensal: number;
  usuarios: string;
  itens: string[];
  destaque: boolean;
};

export type SiteConfig = {
  contato: {
    /** Só dígitos, com DDI. Ex.: 5511999999999 */
    whatsapp: string;
    mensagemWhatsApp: string;
    email: string;
    assuntoEmail: string;
  };
  urls: { app: string; cadastro: string; site: string };
  planos: Plano[];
};

export const PLACEHOLDER = 'TODO_PREENCHER';

export const site: SiteConfig = {
  contato: {
    whatsapp: '5511976608449',
    mensagemWhatsApp: 'Olá! Quero conhecer o Mecanify.',
    email: 'contato@mecanify.com.br',
    assuntoEmail: 'Quero conhecer o Mecanify',
  },
  urls: {
    app: 'https://app.mecanify.com.br/',
    cadastro: 'https://app.mecanify.com.br/?modo=cadastro',
    site: 'https://mecanify.com.br',
  },
  planos: [
    {
      id: 'bancada',
      nome: 'Bancada',
      paraQuem: 'Mecânico solo',
      mensal: 97,
      usuarios: '1 usuário (dono)',
      destaque: false,
      itens: [
        '1 usuário (dono)',
        'Clientes e veículos',
        'Ordens de serviço e pátio',
        'Orçamento pelo WhatsApp e PIX na OS',
      ],
    },
    {
      id: 'patio-pro',
      nome: 'Pátio Pro',
      paraQuem: 'Oficina com 2 a 5 mecânicos',
      mensal: 197,
      usuarios: 'Até 5 usuários',
      destaque: true,
      itens: [
        'Até 5 usuários',
        'Tudo do Bancada',
        'Estoque com baixa na OS',
        'Caixa, contas e DRE',
        'Perfis por cargo: mecânico não vê o financeiro',
        'Equipe e RH: ponto e holerite',
      ],
    },
    {
      id: 'oficina-full',
      nome: 'Oficina Full',
      paraQuem: 'Centros automotivos maiores',
      mensal: 347,
      usuarios: 'Usuários ilimitados',
      destaque: false,
      itens: [
        'Usuários ilimitados',
        'Tudo do Pátio Pro',
        'Auditoria: quem mexeu em cada OS e peça',
        'Suporte prioritário',
      ],
    },
  ],
};
