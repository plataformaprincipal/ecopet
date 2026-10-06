import type { LegalSection } from "@/components/shared/legal/legal-page-layout";

export const CLIENT_COMMERCE_POLICY_SECTIONS: Record<
  "trocas" | "cancelamento" | "reembolso" | "servicos",
  { title: string; updatedAt: string; sections: LegalSection[] }
> = {
  trocas: {
    title: "Política de Trocas e Devoluções",
    updatedAt: "6 de outubro de 2026",
    sections: [
      {
        title: "1. Direito básico do consumidor",
        paragraphs: [
          "Produtos físicos adquiridos na EccoPet observam o Código de Defesa do Consumidor. O consumidor pode desistir da compra em compras à distância no prazo legal de 7 dias, contados do recebimento, quando aplicável.",
          "A EccoPet não reduz direitos obrigatórios do consumidor. Políticas de parceiros só podem complementar, nunca suprimir, essas garantias.",
        ],
      },
      {
        title: "2. Como solicitar",
        paragraphs: [
          "Acesse Meus pedidos → Preciso de ajuda e escolha troca ou devolução. Abriremos um protocolo vinculado ao pedido.",
          "Itens digitais, planos, módulos e EccoPet AI seguem política própria: se não houve consumo, a solicitação é analisada; se já houve uso, o caso vai para atendimento, sem estorno automático que contradiga os termos ou a legislação.",
        ],
      },
    ],
  },
  cancelamento: {
    title: "Política de Cancelamento",
    updatedAt: "6 de outubro de 2026",
    sections: [
      {
        title: "1. Antes do pagamento",
        paragraphs: ["O cancelamento é imediato enquanto o pedido ainda não foi pago."],
      },
      {
        title: "2. Pagamento pendente",
        paragraphs: ["Pix e boleto pendentes podem ser cancelados quando o estado operacional permitir. Não gere uma nova cobrança no mesmo pedido."],
      },
      {
        title: "3. Pagamento aprovado",
        paragraphs: [
          "Se o parceiro ainda não enviou o produto ou não executou o serviço, você pode solicitar cancelamento pela Central de Pós-venda.",
          "Pedido enviado ou serviço já executado não tem cancelamento automático: a análise segue esta política e o CDC.",
        ],
      },
      {
        title: "4. Assinaturas",
        paragraphs: [
          "Cancelar a renovação mantém o acesso até o fim do período já pago, salvo regra legal ou comercial diversa informada na contratação.",
        ],
      },
    ],
  },
  reembolso: {
    title: "Política de Reembolso",
    updatedAt: "6 de outubro de 2026",
    sections: [
      {
        title: "1. Via transação original",
        paragraphs: [
          "Reembolsos são feitos pela transação original no Mercado Pago. Não utilizamos Pix manual como fluxo padrão.",
          "São suportados reembolso total e parcial, com atualização de Payment, Order, Ledger, taxas e saldo do seller.",
        ],
      },
      {
        title: "2. Recusa do seller",
        paragraphs: [
          "Se o parceiro recusar um pedido já pago, o reembolso é iniciado automaticamente. O cliente não precisa abrir o pedido de devolução nesse caso.",
        ],
      },
      {
        title: "3. Chargeback",
        paragraphs: [
          "Contestação no cartão não é tratada como reembolso comum. Registramos o evento, notificamos, preservamos evidências e podemos bloquear payout.",
        ],
      },
    ],
  },
  servicos: {
    title: "Política de Serviços e Termos do Marketplace",
    updatedAt: "6 de outubro de 2026",
    sections: [
      {
        title: "1. Prestação por parceiros",
        paragraphs: [
          "Serviços de clínicas, profissionais e lojas são prestados pelo seller habilitado. A EccoPet intermedia pagamento, pedido e suporte tecnológico.",
        ],
      },
      {
        title: "2. Avaliação",
        paragraphs: [
          "Avaliações públicas existem para parceiros, produtos e serviços de parceiros, somente após entrega ou conclusão, com selo de compra verificada.",
          "Serviços próprios da EccoPet e EccoPet AI não exibem avaliações públicas neste momento.",
        ],
      },
    ],
  },
};
