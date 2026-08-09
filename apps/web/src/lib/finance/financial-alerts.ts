import "server-only";

import { createHash } from "crypto";
import { logStructured } from "@/lib/observability/logger";
import { captureSecurityEvent } from "@/lib/observability/error-capture";
import { writeIntegrationLog } from "@/lib/integrations/log";
import { writeAuditLog } from "@/lib/audit-log";

export type FinancialAlertSeverity = "P0" | "P1" | "P2";

export type FinancialAlertCode =
  | "WEBHOOK_SIGNATURE_FAILURE"
  | "LEDGER_POST_FAILURE"
  | "RECONCILIATION_MISMATCH"
  | "PROVIDER_5XX"
  | "DB_UNAVAILABLE"
  | "PAYOUT_DOUBLE_SPEND"
  | "UNEXPECTED_NEGATIVE_BALANCE"
  | "PROVIDER_AMOUNT_MISMATCH";

/**
 * Emite alerta financeiro P0/P1 comprovável:
 * - log estruturado (Better Stack se configurado)
 * - IntegrationLog (admin/ops)
 * - AuditLog
 * Nunca inclui secrets/HMAC completos.
 */
export async function emitFinancialAlert(params: {
  code: FinancialAlertCode;
  severity: FinancialAlertSeverity;
  message: string;
  meta?: Record<string, string | number | boolean | null | undefined>;
}): Promise<void> {
  const fingerprint = createHash("sha256")
    .update(`${params.code}:${params.message}:${JSON.stringify(params.meta ?? {})}`)
    .digest("hex")
    .slice(0, 12);

  const safeMeta: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params.meta ?? {})) {
    if (v === undefined) continue;
    safeMeta[k] = v;
  }

  logStructured(params.severity === "P0" ? "error" : "warn", `finance.alert.${params.code}`, {
    module: "finance",
    event: "finance.alert",
    alertCode: params.code,
    severity: params.severity,
    fingerprint,
    message: params.message.slice(0, 240),
    ...safeMeta,
  });

  if (
    params.code === "WEBHOOK_SIGNATURE_FAILURE" ||
    params.code === "PAYOUT_DOUBLE_SPEND"
  ) {
    captureSecurityEvent("financial_alert", {
      code: params.code,
      severity: params.severity,
      fingerprint,
    });
  }

  await writeIntegrationLog({
    integrationName: "finance_alerts",
    provider: "ecopet",
    action: `alert:${params.code}`,
    status: params.severity === "P0" ? "error" : "warning",
    message: `[${params.severity}] ${params.code} fp=${fingerprint} ${params.message}`.slice(
      0,
      500
    ),
  }).catch(() => undefined);

  await writeAuditLog({
    action: "SYNC",
    module: "finance",
    resource: "financial_alert",
    resourceId: fingerprint,
    observation: `${params.severity}:${params.code}`,
    metadata: {
      code: params.code,
      severity: params.severity,
      message: params.message.slice(0, 240),
      ...safeMeta,
    },
  }).catch(() => undefined);
}
