/**
 * Parâmetros operacionais comercialmente ajustáveis.
 * Não espalhar prazos mágicos em componentes.
 */
export const COMMERCE_OPS_POLICY = {
  pixWaitMs: 5 * 60 * 1000,
  boletoDueDays: 3,
  sellerAcceptMs: 4 * 60 * 60 * 1000,
  quoteDefaultValidHours: 48,
  reviewAfterDeliveryMs: 0,
  clientCancelBeforeShip: true,
  digitalReleaseRequiresApproved: true,
} as const;

export const PIX_WAIT_MS = COMMERCE_OPS_POLICY.pixWaitMs;

export const SELLER_REJECT_REASONS = [
  "OUT_OF_STOCK",
  "SCHEDULE_UNAVAILABLE",
  "OUT_OF_AREA",
  "LISTING_ERROR",
  "OPERATIONAL_UNAVAILABLE",
  "OTHER",
] as const;

export type SellerRejectReason = (typeof SELLER_REJECT_REASONS)[number];

export const SELLER_REJECT_REASON_LABEL: Record<SellerRejectReason, string> = {
  OUT_OF_STOCK: "Sem estoque",
  SCHEDULE_UNAVAILABLE: "Agenda indisponível",
  OUT_OF_AREA: "Fora da área",
  LISTING_ERROR: "Erro de cadastro",
  OPERATIONAL_UNAVAILABLE: "Indisponibilidade operacional",
  OTHER: "Outro",
};

export const AFTERCARE_REASONS = [
  "CANCEL",
  "EXCHANGE",
  "RETURN",
  "REFUND",
  "WRONG_ITEM",
  "DAMAGED",
  "NOT_RECEIVED",
  "SERVICE_NOT_PROVIDED",
  "SERVICE_MISMATCH",
  "INCORRECT_CHARGE",
  "OTHER",
] as const;

export type AftercareReason = (typeof AFTERCARE_REASONS)[number];

export const AFTERCARE_REASON_LABEL: Record<AftercareReason, string> = {
  CANCEL: "Cancelar pedido",
  EXCHANGE: "Trocar produto",
  RETURN: "Devolver produto",
  REFUND: "Solicitar reembolso",
  WRONG_ITEM: "Produto errado",
  DAMAGED: "Produto danificado",
  NOT_RECEIVED: "Produto não recebido",
  SERVICE_NOT_PROVIDED: "Serviço não prestado",
  SERVICE_MISMATCH: "Serviço diferente do contratado",
  INCORRECT_CHARGE: "Cobrança incorreta",
  OTHER: "Outro",
};

export const AFTERCARE_STATUSES = [
  "OPEN",
  "WAITING_SELLER",
  "WAITING_BUYER",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "REFUND_PROCESSING",
  "REFUNDED",
  "CLOSED",
] as const;

export type AftercareStatus = (typeof AFTERCARE_STATUSES)[number];

export const COMMERCE_REPORT_REASONS = [
  "FRAUD",
  "PROHIBITED_PRODUCT",
  "MISLEADING",
  "MISCONDUCT",
  "SAFETY",
  "SPAM",
  "IP_VIOLATION",
  "OTHER",
] as const;

export const COMMERCE_REPORT_TARGETS = ["partner", "product", "service", "review", "order"] as const;

export function sellerAcceptDeadline(from = new Date(), ms = COMMERCE_OPS_POLICY.sellerAcceptMs) {
  return new Date(from.getTime() + ms);
}

export function isSellerAcceptExpired(deadline: Date | string | null | undefined, now = Date.now()) {
  if (!deadline) return false;
  return new Date(deadline).getTime() <= now;
}

export function boletoDueAt(from = new Date(), days = COMMERCE_OPS_POLICY.boletoDueDays) {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export function partnerOrderTab(status: string): "novos" | "aceitos" | "preparacao" | "andamento" | "concluidos" | "cancelados" | "problemas" {
  switch (status) {
    case "PAID":
    case "PENDING_CONFIRMATION":
      return "novos";
    case "CONFIRMED":
      return "aceitos";
    case "PREPARING":
    case "READY_FOR_PICKUP":
    case "READY_PICKUP":
      return "preparacao";
    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
      return "andamento";
    case "DELIVERED":
    case "COMPLETED":
    case "PICKED_UP":
      return "concluidos";
    case "CANCELLED":
      return "cancelados";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "problemas";
    default:
      return "novos";
  }
}

export function operationalLabel(status: string, kind: "product" | "service" = "product") {
  if (kind === "service") {
    const map: Record<string, string> = {
      PAID: "Pagamento aprovado",
      PENDING_CONFIRMATION: "Aguardando confirmação",
      CONFIRMED: "Aceito",
      PREPARING: "Agendando",
      READY_FOR_PICKUP: "Agendado",
      SHIPPED: "Em atendimento",
      OUT_FOR_DELIVERY: "Em atendimento",
      DELIVERED: "Concluído",
      COMPLETED: "Concluído",
      CANCELLED: "Cancelado",
      REFUNDED: "Reembolsado",
    };
    return map[status] ?? status;
  }
  const map: Record<string, string> = {
    PENDING: "Aguardando pagamento",
    PENDING_CONFIRMATION: "Aguardando confirmação",
    PAID: "Pagamento aprovado · aguardando o parceiro",
    CONFIRMED: "Parceiro aceitou",
    PREPARING: "Preparando",
    READY_FOR_PICKUP: "Pronto para retirada",
    READY_PICKUP: "Pronto para retirada",
    SHIPPED: "Enviado",
    OUT_FOR_DELIVERY: "Saiu para entrega",
    DELIVERED: "Entregue",
    PICKED_UP: "Retirado",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
    REFUNDED: "Reembolsado",
    PARTIALLY_REFUNDED: "Reembolso parcial",
  };
  return map[status] ?? status;
}
