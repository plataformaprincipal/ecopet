import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { buildHealthCenter } from "@/lib/client/health-center";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const health = await buildHealthCenter(prisma, user!.id);
  return apiSuccess({ health });
}
