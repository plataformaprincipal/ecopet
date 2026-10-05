import { isCheckoutTestOrderNotes } from "./test-credentials";

export function checkoutTestAmount(order: { deliveryNotes: string | null; pricingSnapshot: unknown }): number {
  if (!isCheckoutTestOrderNotes(order.deliveryNotes)) return 0;
  const snapshot = order.pricingSnapshot as Record<string, unknown> | null;
  const amount = snapshot?.isolated === true && snapshot.checkoutTest === true ? Number(snapshot.testAmount) : 0;
  return Number.isFinite(amount) && amount > 0 && amount <= 10000 ? amount : 0;
}

/** Only TEST endpoints may project the sandbox amount into their response. */
export function checkoutTestPublicOrder<T extends { deliveryNotes: string | null; pricingSnapshot: unknown }>(order: T) {
  return { ...order, total: checkoutTestAmount(order) };
}

export function testStatus(status: string): string {
  return status.startsWith("TEST_") ? status.slice(5) : status;
}
