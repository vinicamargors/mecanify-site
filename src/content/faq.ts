export type Pergunta = { pergunta: string; resposta: string };

export const faq: Pergunta[] = [
  {
    pergunta: 'Preciso de cartão de crédito para testar?',
    resposta: 'Não. Os 30 dias são grátis, sem cartão e sem fidelidade. Você só escolhe um plano se quiser continuar.',
  },
  {
    pergunta: 'Posso cancelar quando quiser?',
    resposta: 'Sim. Não há multa nem contrato de fidelidade. Você cancela a qualquer momento.',
  },
  {
    pergunta: 'O que acontece com meus dados se o teste acabar?',
    resposta:
      'Nada é apagado. Ao fim do teste você continua com acesso para consultar clientes, veículos e histórico.',
  },
  {
    pergunta: 'Funciona no celular?',
    resposta:
      'Sim. O Mecanify foi feito para o celular do pátio e para o computador do balcão. O mecânico avança a etapa da OS com uma mão.',
  },
  {
    pergunta: 'Como saio do papel ou da planilha?',
    resposta:
      'Você cadastra cliente e veículo pela placa e já abre a primeira ordem de serviço. Se quiser ajuda, chame a gente no WhatsApp.',
  },
  {
    pergunta: 'Quantos usuários posso ter?',
    resposta: 'O Bancada tem 1 usuário (o dono), o Pátio Pro até 5 e o Oficina Full usuários ilimitados.',
  },
];
