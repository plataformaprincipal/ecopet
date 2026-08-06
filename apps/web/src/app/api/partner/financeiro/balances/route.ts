import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { getPartnerBalances } from "@/lib/finance/balances";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Saldo do parceiro autenticado apenas (anti-IDOR). */
export async function GET() {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const partnerId = user!.id;

  const balances = await getPartnerBalances(partnerId);
  const entries = await prisma.financialLedgerEntry.findMany({
    where: { partnerId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      entryType: true,
      direction: true,
      amountCents: true,
      status: true,
      orderId: true,
      occurredAt: true,
      description: true,
    },
  });
  const payouts = await prisma.partnerPayout.findMany({
    where: { partnerId },
    orderBy: { requestedAt: "desc" },
    take: 30,
    select: {
      id: true,
      amountCents: true,
      status: true,
      requestedAt: true,
      paidAt: true,
      failureReason: true,
    },
  });

  return apiSuccess({
    balances,
    entries,
    payouts,
    notes: balances.disclaimer,
  });
}

/** Parceiro não pode alterar saldo via POST. */
export async function POST() {
  return apiFailure("FORBIDDEN", "Parceiro não pode alterar saldo ou lançamentos", 403);
}
