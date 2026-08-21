export function couponAllowsSku(eligibleSkus: unknown, sku: string): boolean {
  if (!Array.isArray(eligibleSkus) || eligibleSkus.length === 0) return false;
  return eligibleSkus.some((s) => String(s) === sku);
}
