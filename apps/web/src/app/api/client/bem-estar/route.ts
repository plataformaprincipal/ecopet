import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { buildClientWellnessPanel } from "@/lib/client/wellness-panel";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const wellness = await buildClientWellnessPanel(prisma, user!.id);
  return apiSuccess({ wellness });
}
