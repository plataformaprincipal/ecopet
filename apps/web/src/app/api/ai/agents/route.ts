import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { listAgentsForRole } from "@/lib/ai/permissions";
import { AI_INTEGRATION_POINTS } from "@/lib/ai/integration-points";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const agents = listAgentsForRole(user.role).map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    integrationPoints: a.integrationPoints,
    tools: a.toolIds,
  }));

  const integrationPoints = AI_INTEGRATION_POINTS.filter((p) =>
    agents.some((a) => a.integrationPoints.includes(p.id))
  );

  return apiSuccess({ agents, integrationPoints });
}
