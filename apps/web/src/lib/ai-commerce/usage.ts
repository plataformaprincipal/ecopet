const TERMINAL_NO_USAGE = new Set(["REVOKED", "REFUNDED", "EXPIRED", "CONSUMED"]);

export function remainingUsage(params: {
  usageLimit: number;
  usageCount: number;
  status: string;
}): number {
  if (TERMINAL_NO_USAGE.has(params.status)) return 0;
  return Math.max(0, params.usageLimit - params.usageCount);
}
