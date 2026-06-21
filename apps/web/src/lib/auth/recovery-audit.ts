import type { AuditAction } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit-log";

export type RecoveryAuditEvent =
  | "request"
  | "verify_success"
  | "verify_failed"
  | "reset_success"
  | "blocked";

function actionFor(event: RecoveryAuditEvent): AuditAction {
  if (event === "reset_success") return "UPDATE";
  if (event === "request") return "VIEW";
  return "VIEW";
}

export async function logRecoveryAudit(params: {
  userId?: string | null;
  event: RecoveryAuditEvent;
  channel?: "email" | "phone";
  ip?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await writeAuditLog({
      actorId: params.userId ?? null,
      action: actionFor(params.event),
      module: "auth",
      resource: "password_recovery",
      resourceId: params.userId ?? undefined,
      observation: `password_recovery_${params.event}`,
      metadata: {
        channel: params.channel,
        ip: params.ip,
        ...params.metadata,
      },
    });
  } catch {
    /* não interromper fluxo de recuperação */
  }
}
