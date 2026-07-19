import { UserRole } from "@prisma/client";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getGoogleMapsAdminDiagnostics } from "@/lib/google-maps/metrics";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Diagnóstico ADMIN — sem disparar Geocoding/Directions pagos. */
export async function GET() {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  if (!checkRateLimit(`gmaps-diag:${user!.id}`, 20, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de diagnósticos.", 429);
  }

  const data = await getGoogleMapsAdminDiagnostics();

  try {
    await prisma.auditLog.create({
      data: {
        userId: user!.id,
        action: "VIEW",
        module: "admin-integrations",
        resource: "google-maps-diagnostics",
        status: "success",
        metadata: {
          status: data.status.status,
          configured: data.status.configured,
        },
      },
    });
  } catch {
    /* best-effort */
  }

  return apiSuccess(data);
}
