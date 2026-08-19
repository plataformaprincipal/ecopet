import { OrderStatus, AppointmentStatus } from "@prisma/client";

export const DEFAULT_LOYALTY_POLICY = {
  enabled: true,
  pointsPerBrl: 1,
  servicePointsPerBrl: 1,
  expirationDays: null as number | null,
  maxEarnPerEvent: null as number | null,
  minRedeemPoints: 1,
  referralEnabled: false,
  overdraftPolicy: "forbid" as const,
};

export const ORDER_EARN_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.PREPARING,
  OrderStatus.CONFIRMED,
  OrderStatus.READY_PICKUP,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
  OrderStatus.PICKED_UP,
];

export const ORDER_REVERSAL_STATUSES: OrderStatus[] = [
  OrderStatus.REFUNDED,
  OrderStatus.PARTIALLY_REFUNDED,
  OrderStatus.CANCELLED,
];

export function isOrderEligibleForEarn(status: OrderStatus): boolean {
  return ORDER_EARN_STATUSES.includes(status);
}

export function isOrderReversalStatus(status: OrderStatus): boolean {
  return ORDER_REVERSAL_STATUSES.includes(status);
}

export function isServiceEligibleForEarn(status: AppointmentStatus): boolean {
  return status === AppointmentStatus.COMPLETED;
}

export function computeEarnPoints(input: {
  amountBrl: number;
  pointsPerBrl: number;
  multiplier?: number;
  maxEarnPerEvent?: number | null;
}): number {
  if (!Number.isFinite(input.amountBrl) || input.amountBrl <= 0) return 0;
  if (!Number.isFinite(input.pointsPerBrl) || input.pointsPerBrl <= 0) return 0;
  const multiplier = Number.isFinite(input.multiplier) && (input.multiplier ?? 0) > 0 ? (input.multiplier as number) : 1;
  const raw = Math.floor(input.amountBrl * input.pointsPerBrl * multiplier);
  if (raw <= 0) return 0;
  if (input.maxEarnPerEvent != null && input.maxEarnPerEvent > 0) {
    return Math.min(raw, input.maxEarnPerEvent);
  }
  return raw;
}

export function computeReversalPoints(input: {
  earned: number;
  alreadyReversed: number;
  availableBalance: number;
  fraction?: number;
}): { toReverse: number; unrecovered: number } {
  const remaining = Math.max(0, input.earned - Math.max(0, input.alreadyReversed));
  const fraction = input.fraction == null || !Number.isFinite(input.fraction) ? 1 : Math.min(1, Math.max(0, input.fraction));
  const fromFraction = Math.floor(Math.max(0, input.earned) * fraction);
  const requested = Math.min(remaining, fromFraction);
  const toReverse = Math.min(requested, Math.max(0, input.availableBalance));
  return { toReverse, unrecovered: Math.max(0, requested - toReverse) };
}

export function normalizeLedgerPoints(type: string, points: number): number {
  if (!Number.isFinite(points) || points === 0) return 0;
  if (type === "EARN" || type === "BONUS") return Math.abs(points);
  if (type === "REDEEM" || type === "EXPIRE" || type === "REVERSAL") return -Math.abs(points);
  return points;
}

export function earnOrderKey(orderId: string) {
  return `ORDER_COMPLETED:${orderId}`;
}

export function reverseOrderKey(orderId: string, refundId?: string) {
  return refundId ? `ORDER_REFUNDED:${orderId}:${refundId}` : `ORDER_REFUNDED:${orderId}`;
}

export function earnServiceKey(appointmentId: string) {
  return `SERVICE_COMPLETED:${appointmentId}`;
}

export function reverseServiceKey(appointmentId: string) {
  return `SERVICE_REVERSED:${appointmentId}`;
}

export function redeemKey(userId: string, rewardId: string, requestId: string) {
  return `REDEEM:${userId}:${rewardId}:${requestId}`;
}

export function adjustmentKey(userId: string, requestId: string) {
  return `ADJUSTMENT:${userId}:${requestId}`;
}

export function expiresAtFromPolicy(expirationDays: number | null | undefined, now = new Date()): Date | undefined {
  if (expirationDays == null || expirationDays <= 0) return undefined;
  return new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000);
}

/** `null` = estorno parcial sem valor — não reverter (o fluxo de refunds.ts traz o amount). */
export function refundEarnFraction(params: {
  fullRefund?: boolean;
  refundAmount?: number;
  orderTotal: number;
}): number | null {
  if (params.fullRefund) return 1;
  if (params.refundAmount == null || !Number.isFinite(params.refundAmount)) return null;
  if (!(params.orderTotal > 0)) return 1;
  return Math.min(1, Math.max(0, params.refundAmount / params.orderTotal));
}
