import { UserRole } from "@prisma/client";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getTurnstileAdminDiagnostics } from "@/lib/turnstile/admin-diagnostics";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET — diagnóstico ADMIN Turnstile (sem gerar desafio). */
export async function GET() {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  if (!checkRateLimit(`turnstile-diag:${user!.id}`, 20, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de diagnósticos.", 429);
  }

  const data = await getTurnstileAdminDiagnostics();

  try {
    await prisma.auditLog.create({
      data: {
        userId: user!.id,
        action: "VIEW",
        module: "admin-integrations",
        resource: "turnstile-diagnostics",
        status: "success",
        metadata: {
          status: data.status.status,
          configured: data.status.configured,
        },
      },
    });
  } catch {
    /* audit best-effort */
  }

  return apiSuccess(data);
}
