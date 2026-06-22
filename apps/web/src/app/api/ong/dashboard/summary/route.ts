import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { buildOngDashboardSummary } from "@/lib/ong/ai-insights";
import { requireOngWithAccess } from "@/lib/ong/require-ong-access";

export async function GET() {
  const { user, accessLevel, error } = await requireOngWithAccess();
  if (error) return error;

  const summary = await buildOngDashboardSummary(prisma, user!.id);

  return apiSuccess({
    accessLevel,
    summary,
  });
}
