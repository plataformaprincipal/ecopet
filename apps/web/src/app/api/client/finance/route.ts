import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { buildClientFinancePanel } from "@/lib/client/finance-panel";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const finance = await buildClientFinancePanel(prisma, user!.id);
  return apiSuccess({ finance });
}
