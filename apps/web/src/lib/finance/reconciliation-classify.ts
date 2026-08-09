import type { FinancialReconciliationStatus } from "@prisma/client";

/** Compara expected local vs provider (igualdade estrita em centavos). */
export function classifyAmountReconciliation(params: {
  expectedAmountCents: number;
  providerAmountCents: number | null;
  providerFetchOk: boolean;
  providerUnavailable: boolean;
}): FinancialReconciliationStatus | null {
  if (params.providerUnavailable) return "MANUAL_REVIEW";
  if (!params.providerFetchOk || params.providerAmountCents == null) {
    return "MANUAL_REVIEW";
  }
  if (params.expectedAmountCents !== params.providerAmountCents) {
    return "VALUE_MISMATCH";
  }
  return null;
}
