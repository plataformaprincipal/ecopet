/**
 * Mapeamento centralizado: status API Orders → status interno EcoPet.
 */

export type InternalPaymentStatus =
  | "CREATED"
  | "PENDING"
  | "PROCESSING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "CHARGED_BACK"
  | "ERROR"
  | "ACTION_REQUIRED";

export function mapMpOrderStatusToInternal(
  status: string | undefined,
  statusDetail?: string | undefined
): InternalPaymentStatus {
  const s = (status || "").toLowerCase();
  const detail = (statusDetail || "").toLowerCase();

  if (s === "processed" && (detail.includes("accredited") || detail.includes("approved"))) {
    return "APPROVED";
  }
  if (s === "processed") return "APPROVED";
  if (s === "action_required") return "ACTION_REQUIRED";
  if (s === "processing" || s === "created") return s === "created" ? "CREATED" : "PROCESSING";
  if (s === "cancelled" || detail.includes("cancelled")) return "CANCELLED";
  if (s === "expired" || detail.includes("expired")) return "EXPIRED";
  if (s === "refunded" || detail.includes("refunded")) {
    if (detail.includes("partial")) return "PARTIALLY_REFUNDED";
    return "REFUNDED";
  }
  if (s === "charged_back" || detail.includes("charged_back")) return "CHARGED_BACK";
  if (s === "failed" || detail.includes("rejected") || detail.includes("cc_rejected")) {
    return "REJECTED";
  }
  if (detail.includes("pending") || detail.includes("waiting")) return "PENDING";
  if (!s) return "ERROR";
  return "PENDING";
}

export function isTerminalApproved(status: InternalPaymentStatus): boolean {
  return status === "APPROVED";
}

export function isTerminalFailure(status: InternalPaymentStatus): boolean {
  return (
    status === "REJECTED" ||
    status === "CANCELLED" ||
    status === "EXPIRED" ||
    status === "ERROR"
  );
}

export function isRefundedStatus(status: InternalPaymentStatus): boolean {
  return status === "REFUNDED" || status === "PARTIALLY_REFUNDED" || status === "CHARGED_BACK";
}
