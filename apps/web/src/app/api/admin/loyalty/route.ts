import { UserRole } from "@prisma/client";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateLoyaltyAccount } from "@/lib/loyalty/service";
import { getOrCreateLoyaltyPolicy } from "@/lib/loyalty/policy";

export async function GET(request: Request) {
  const { error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  const userId = url.searchParams.get("userId")?.trim();
  const policy = await getOrCreateLoyaltyPolicy();

  if (!email && !userId) {
    return apiSuccess({
      policy,
      hint: "Informe email ou userId para consultar uma carteira.",
    });
  }

  const user = await prisma.user.findFirst({
    where: email ? { email } : { id: userId! },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return apiFailure("NOT_FOUND", "Usuário não encontrado.", 404);

  const account = await getOrCreateLoyaltyAccount(user.id);
  const transactions = await prisma.loyaltyTransaction.findMany({
    where: { loyaltyAccountId: account.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return apiSuccess({
    policy,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    account: {
      pointsBalance: account.pointsBalance,
      lifetimePoints: account.lifetimePoints,
      tier: account.tier,
    },
    transactions: transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      points: tx.points,
      sourceType: tx.sourceType,
      sourceId: tx.sourceId,
      description: tx.description,
      createdAt: tx.createdAt,
    })),
  });
}
