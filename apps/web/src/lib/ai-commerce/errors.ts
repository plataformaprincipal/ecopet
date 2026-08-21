export class AiCommerceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400
  ) {
    super(message);
    this.name = "AiCommerceError";
  }
}

export const USER_FACING_ERRORS: Record<string, { title: string; message: string }> = {
  AI_COMMERCE_DISABLED: {
    title: "Indisponível",
    message: "As ferramentas EccoPet AI ainda não estão à venda neste ambiente.",
  },
  PRICE_PENDING: {
    title: "Preço em definição",
    message: "O preço deste serviço está em confirmação comercial. Tente novamente em breve.",
  },
  PAYMENT_DECLINED: {
    title: "Pagamento recusado",
    message: "Não foi possível aprovar este pagamento. Revise os dados ou escolha outro meio.",
  },
  AI_UNAVAILABLE: {
    title: "IA indisponível",
    message: "Não conseguimos concluir sua análise agora. Sua utilização não foi consumida.",
  },
  FILE_UNREADABLE: {
    title: "Arquivo",
    message: "Não conseguimos ler este arquivo. Envie um PDF ou imagem com boa qualidade.",
  },
  PET_REQUIRED: {
    title: "Cadastre seu pet",
    message: "Cadastre seu pet antes de continuar.",
  },
  AUTH_REQUIRED: {
    title: "Entre na sua conta",
    message: "Para concluir a compra, entre ou crie sua conta EccoPet.",
  },
  ENTITLEMENT_UNAVAILABLE: {
    title: "Utilização indisponível",
    message: "Esta utilização não está disponível. Compre novamente para continuar.",
  },
  MIXED_CART_SPLIT: {
    title: "Pagamento separado",
    message: "Serviços digitais e produtos físicos são pagos em fluxos separados.",
  },
};
