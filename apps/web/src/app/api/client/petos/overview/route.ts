import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { buildPetOsOverview } from "@/lib/client/petos-overview";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const overview = await buildPetOsOverview(prisma, user!.id);
  return apiSuccess({ overview });
}
