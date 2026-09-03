import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const rows = await prisma.creditLedgerEntry.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const now = new Date();
  const available = rows
    .filter((r) => r.status === "AVAILABLE" && (!r.expiresAt || r.expiresAt > now))
    .reduce((s, r) => s + r.amountCents, 0);
  return apiSuccess({ entries: rows, availableCents: available, withdrawable: false });
}
