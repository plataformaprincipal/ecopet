import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { buildClientIotPanel } from "@/lib/client/iot-panel";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const panel = await buildClientIotPanel(prisma, user!.id);
  return apiSuccess({ iot: panel });
}
