import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { buildClientDashboardSummary } from "@/lib/client/dashboard-summary";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const summary = await buildClientDashboardSummary(prisma, user!.id);
  return apiSuccess({ summary });
}
