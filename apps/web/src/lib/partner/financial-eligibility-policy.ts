export type PartnerFinancialStatus =
  "NOT_CONFIGURED" | "PENDING" | "UNDER_REVIEW" | "ACTIVE" | "BLOCKED";

type FinancialDetails = Record<string, unknown>;

function asRecord(value: unknown): FinancialDetails {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as FinancialDetails)
    : {};
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Financial readiness is derived server-side from the partner profile. The raw details never leave
 * this service, preventing financial identifiers from leaking through catalog endpoints.
 */
export function evaluatePartnerFinancialDetails(value: unknown): {
  status: PartnerFinancialStatus;
  canPublish: boolean;
} {
  const details = asRecord(value);
  const explicit = String(details.status ?? "")
    .trim()
    .toUpperCase();
  if (["BLOCKED", "ERROR", "REJECTED"].includes(explicit)) {
    return { status: "BLOCKED", canPublish: false };
  }
  if (["UNDER_REVIEW", "IN_REVIEW", "ANALYSIS"].includes(explicit)) {
    return { status: "UNDER_REVIEW", canPublish: false };
  }

  const methods = Array.isArray(details.paymentMethods)
    ? details.paymentMethods
    : [];
  const hasPixReceivingData =
    methods.some((method) => String(method).trim().toLowerCase() === "pix") &&
    hasText(details.pixKeyType) &&
    hasText(details.pixKey);
  const hasBankReceivingData =
    hasText(details.bankName) &&
    hasText(details.agency) &&
    hasText(details.accountNumber) &&
    hasText(details.accountHolder) &&
    hasText(details.accountHolderDocument);

  if (hasPixReceivingData || hasBankReceivingData) {
    return { status: "ACTIVE", canPublish: true };
  }
  if (Object.keys(details).length === 0)
    return { status: "NOT_CONFIGURED", canPublish: false };
  return { status: "PENDING", canPublish: false };
}
