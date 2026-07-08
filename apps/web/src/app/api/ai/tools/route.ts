import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { listTools } from "@/lib/ai/tools/registry";
import { listDbTools } from "@/lib/ai/db/bootstrap";
import type { AiAgentId } from "@/lib/ai/types";

export async function GET(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const url = new URL(request.url);
  const agentId = url.searchParams.get("agentId") as AiAgentId | null;

  const tools = listTools({
    agentId: agentId ?? undefined,
    role: user.role,
  }).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    permissions: t.requiredRoles,
    parameters: t.parameters,
    status: t.status,
  }));

  const dbTools = await listDbTools();

  return apiSuccess({
    tools,
    registered: dbTools.length,
  });
}
