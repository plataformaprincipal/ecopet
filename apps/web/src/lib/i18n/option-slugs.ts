/** Slugs estáveis para opções cujo valor armazenado é texto PT */

export const CORPORATE_TYPE_SLUG: Record<string, string> = {
  MEI: "MEI",
  Microempresa: "MICROEMPRESA",
  "Empresa de Pequeno Porte": "EPP",
  "Empresa Ltda.": "LTDA",
  "Sociedade Simples": "SOCIEDADE_SIMPLES",
  Associação: "ASSOCIACAO",
  Cooperativa: "COOPERATIVA",
  "Prestadora de Serviço": "PRESTADORA",
  Outro: "OUTRO",
};

export const STREET_TYPE_SLUG: Record<string, string> = {
  Rua: "RUA",
  Avenida: "AVENIDA",
  Travessa: "TRAVESSA",
  Alameda: "ALAMEDA",
  Praça: "PRACA",
  Estrada: "ESTRADA",
  Rodovia: "RODOVIA",
  Ladeira: "LADEIRA",
  Viela: "VIELA",
  Condomínio: "CONDOMINIO",
  Sítio: "SITIO",
  Fazenda: "FAZENDA",
  Chácara: "CHACARA",
  Comunidade: "COMUNIDADE",
  Distrito: "DISTRITO",
  Outro: "OUTRO",
};

export const PAYMENT_METHOD_SLUG: Record<string, string> = {
  Pix: "PIX",
  Dinheiro: "DINHEIRO",
  "Cartão de crédito": "CREDIT_CARD",
  "Cartão de débito": "DEBIT_CARD",
  Boleto: "BOLETO",
  "Transferência bancária": "BANK_TRANSFER",
  "Link de pagamento": "PAYMENT_LINK",
  "Carteira digital": "DIGITAL_WALLET",
  "Apple Pay": "APPLE_PAY",
  "Google Pay": "GOOGLE_PAY",
  "Mercado Pago": "MERCADO_PAGO",
  PicPay: "PICPAY",
  PayPal: "PAYPAL",
  PagSeguro: "PAGSEGURO",
  Stripe: "STRIPE",
  "Pagar.me": "PAGAR_ME",
  "Pagamento no local": "ON_SITE",
  "Pagamento na retirada": "ON_PICKUP",
  "Pagamento na entrega": "ON_DELIVERY",
  "Assinatura mensal": "MONTHLY",
  "Sob consulta": "ON_REQUEST",
};

export const PIX_KEY_TYPE_SLUG: Record<string, string> = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  "E-mail": "EMAIL",
  Telefone: "PHONE",
  "Chave aleatória": "RANDOM",
};

export const BANK_SLUG: Record<string, string> = {
  "Banco do Brasil": "BB",
  "Caixa Econômica Federal": "CAIXA",
  Bradesco: "BRADESCO",
  Itaú: "ITAU",
  Santander: "SANTANDER",
  Nubank: "NUBANK",
  Inter: "INTER",
  "C6 Bank": "C6",
  Sicredi: "SICREDI",
  Sicoob: "SICOOB",
  "Banco Pan": "PAN",
  "BTG Pactual": "BTG",
  "Mercado Pago": "MERCADO_PAGO",
  PagSeguro: "PAGSEGURO",
  Stone: "STONE",
  PicPay: "PICPAY",
  Outros: "OUTROS",
};

export const ACCOUNT_TYPE_SLUG: Record<string, string> = {
  Corrente: "CHECKING",
  Poupança: "SAVINGS",
  Pagamento: "PAYMENT",
};

export const ONG_ROLE_SLUG: Record<string, string> = {
  Presidente: "PRESIDENT",
  "Diretor(a)": "DIRECTOR",
  "Fundador(a)": "FOUNDER",
  "Coordenador(a)": "COORDINATOR",
  "Representante Legal": "LEGAL_REP",
  Outro: "OTHER",
};

export const ONG_FOCUS_SLUG: Record<string, string> = {
  "Proteção Animal": "PROTECTION",
  "Resgate e Adoção": "RESCUE_ADOPTION",
  "Saúde Animal": "HEALTH",
  "Educação e Conscientização": "EDUCATION",
  "Defesa dos Direitos Animais": "RIGHTS",
  Outro: "OTHER",
};

export function slugLookup(map: Record<string, string>, value: string): string {
  return map[value] ?? value.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
}
