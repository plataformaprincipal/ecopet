/**
 * Máquina de estados comercial mínima — Fonte única de transições permitidas.
 * Documentação: docs/ORDER_STATE_MACHINE.md
 */
import { OrderStatus } from "@prisma/client";

export type OrderActor = "gateway" | "client" | "partner" | "admin" | "system";

/** Status financeiros — parceiro/cliente nunca definem. */
export const FINANCIAL_STATUSES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.PAID,
  OrderStatus.REFUNDED,
  OrderStatus.PARTIALLY_REFUNDED,
]);

/** Fulfillment operacional permitido ao parceiro (após pagamento). */
const PARTNER_FULFILLMENT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAID: [OrderStatus.CONFIRMED, OrderStatus.PREPARING],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.READY_PICKUP,
    OrderStatus.SHIPPED,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.CANCELLED,
  ],
  READY_FOR_PICKUP: [OrderStatus.PICKED_UP],
  READY_PICKUP: [OrderStatus.PICKED_UP],
  SHIPPED: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
  DELIVERED: [OrderStatus.COMPLETED],
  PICKED_UP: [OrderStatus.COMPLETED],
  PENDING_CONFIRMATION: [OrderStatus.CANCELLED],
};

type TransitionMap = Partial<Record<OrderStatus, Partial<Record<OrderStatus, OrderActor[]>>>>;

const TRANSITIONS: TransitionMap = {
  PENDING: {
    PENDING_CONFIRMATION: ["system", "client"],
    CANCELLED: ["client", "admin", "system"],
  },
  PENDING_CONFIRMATION: {
    PAID: ["gateway", "system"],
    CANCELLED: ["client", "partner", "admin", "system"],
    CONFIRMED: ["partner", "admin"],
  },
  PAID: {
    CONFIRMED: ["partner", "admin", "system"],
    PREPARING: ["partner", "admin"],
    CANCELLED: ["admin", "system"],
    REFUNDED: ["gateway", "admin", "system"],
    PARTIALLY_REFUNDED: ["gateway", "admin", "system"],
  },
  CONFIRMED: {
    PREPARING: ["partner", "admin"],
    CANCELLED: ["partner", "admin"],
    REFUNDED: ["gateway", "admin", "system"],
  },
  PREPARING: {
    READY_FOR_PICKUP: ["partner", "admin"],
    READY_PICKUP: ["partner", "admin"],
    SHIPPED: ["partner", "admin"],
    OUT_FOR_DELIVERY: ["partner", "admin"],
    CANCELLED: ["admin"],
    REFUNDED: ["gateway", "admin", "system"],
  },
  READY_FOR_PICKUP: {
    PICKED_UP: ["partner", "admin", "client", "system"],
    CANCELLED: ["admin"],
  },
  READY_PICKUP: {
    PICKED_UP: ["partner", "admin", "client", "system"],
  },
  SHIPPED: {
    OUT_FOR_DELIVERY: ["partner", "admin"],
    DELIVERED: ["partner", "admin", "system"],
  },
  OUT_FOR_DELIVERY: {
    DELIVERED: ["partner", "admin", "system"],
  },
  DELIVERED: {
    COMPLETED: ["partner", "admin", "system"],
  },
  PICKED_UP: {
    COMPLETED: ["partner", "admin", "system"],
  },
  COMPLETED: {
    REFUNDED: ["admin", "gateway", "system"],
    PARTIALLY_REFUNDED: ["admin", "gateway", "system"],
  },
};

export class InvalidOrderTransitionError extends Error {
  constructor(
    public readonly from: OrderStatus,
    public readonly to: OrderStatus,
    public readonly actor: OrderActor
  ) {
    super(`INVALID_ORDER_TRANSITION:${from}->${to}:${actor}`);
    this.name = "InvalidOrderTransitionError";
  }
}

export function assertOrderTransition(
  from: OrderStatus,
  to: OrderStatus,
  actor: OrderActor
): void {
  if (from === to) return;

  if (FINANCIAL_STATUSES.has(to) && (actor === "client" || actor === "partner")) {
    throw new InvalidOrderTransitionError(from, to, actor);
  }

  // Transições proibidas explícitas
  if (from === OrderStatus.CANCELLED && to === OrderStatus.PAID) {
    throw new InvalidOrderTransitionError(from, to, actor);
  }
  if (from === OrderStatus.REFUNDED && to === OrderStatus.PROCESSING) {
    throw new InvalidOrderTransitionError(from, to, actor);
  }
  if (from === OrderStatus.COMPLETED && to === OrderStatus.PENDING_CONFIRMATION) {
    throw new InvalidOrderTransitionError(from, to, actor);
  }
  if (from === OrderStatus.COMPLETED && to === OrderStatus.PENDING) {
    throw new InvalidOrderTransitionError(from, to, actor);
  }

  const allowedActors = TRANSITIONS[from]?.[to];
  if (allowedActors?.includes(actor)) return;

  if (actor === "partner" || actor === "admin") {
    const next = PARTNER_FULFILLMENT[from] ?? [];
    if (next.includes(to) && !FINANCIAL_STATUSES.has(to)) return;
  }

  throw new InvalidOrderTransitionError(from, to, actor);
}

export function canClientCancel(status: OrderStatus): boolean {
  return status === OrderStatus.PENDING || status === OrderStatus.PENDING_CONFIRMATION;
}

export function canRequestRefund(status: OrderStatus): boolean {
  return (
    status === OrderStatus.PAID ||
    status === OrderStatus.CONFIRMED ||
    status === OrderStatus.PREPARING
  );
}

export function isPartnerOperationalStatus(status: OrderStatus): boolean {
  return !FINANCIAL_STATUSES.has(status);
}
