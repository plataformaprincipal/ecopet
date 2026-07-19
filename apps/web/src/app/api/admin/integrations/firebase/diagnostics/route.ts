import { UserRole } from "@prisma/client";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getFirebaseAdminDiagnostics } from "@/lib/firebase/metrics";
import { prisma } from "@/lib/prisma";
import { resolvePublicAppUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  if (!checkRateLimit(`firebase-diag:${user!.id}`, 20, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de diagnósticos.", 429);
  }

  let baseUrl: string | undefined;
  try {
    baseUrl = resolvePublicAppUrl();
  } catch {
    baseUrl = undefined;
  }

  const data = await getFirebaseAdminDiagnostics(baseUrl);

  try {
    await prisma.auditLog.create({
      data: {
        userId: user!.id,
        action: "VIEW",
        module: "admin-integrations",
        resource: "firebase-diagnostics",
        status: "success",
        metadata: {
          status: data.status.status,
          configured: data.status.configured,
          activeDevices: data.metrics.activeDevices,
        },
      },
    });
  } catch {
    /* audit best-effort */
  }

  return apiSuccess(data);
}
