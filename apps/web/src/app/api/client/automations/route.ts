import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { buildClientAutomationsPanel } from "@/lib/client/automations";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const panel = await buildClientAutomationsPanel(prisma, user!.id);
  return apiSuccess({ automations: panel });
}
