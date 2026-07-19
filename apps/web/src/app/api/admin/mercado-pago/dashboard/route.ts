import { UserRole } from "@prisma/client";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getMercadoPagoWebhookDashboard } from "@/lib/mercado-pago/admin-webhook-dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;
  if (!checkRateLimit(`mp-admin-dash:${user!.id}`, 30, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite excedido.", 429);
  }
  const data = await getMercadoPagoWebhookDashboard();
  return apiSuccess(data);
}
