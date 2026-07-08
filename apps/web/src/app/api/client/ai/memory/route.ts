import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { buildClientAiMemory } from "@/lib/client/client-ai-memory";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const memory = await buildClientAiMemory(user!.id);
  return apiSuccess({ memory });
}
