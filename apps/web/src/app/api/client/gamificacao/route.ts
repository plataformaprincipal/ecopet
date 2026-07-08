import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { buildClientGamificationPanel } from "@/lib/client/gamification-panel";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const gamification = await buildClientGamificationPanel(prisma, user!.id);
  return apiSuccess({ gamification });
}
