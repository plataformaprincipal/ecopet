import "server-only";
import { prisma } from "@/lib/prisma";
import { CatalogCommerceError } from "./checkout";

export async function grantInternalCredit(params: {
  userId: string;
  source: string;
  amountCents: number;
  expiresAt?: Date | null;
  reference?: string | null;
}) {
  if (!(params.amountCents > 0)) throw new CatalogCommerceError("INVALID_AMOUNT", "Crédito inválido.", 400);
  return prisma.creditLedgerEntry.create({
    data: {
      userId: params.userId,
      source: params.source,
      amountCents: params.amountCents,
      expiresAt: params.expiresAt ?? null,
      reference: params.reference ?? null,
      status: "AVAILABLE",
    },
  });
}

export async function consumeInternalCredit(params: { userId: string; amountCents: number; reference?: string }) {
  const rows = await prisma.creditLedgerEntry.findMany({
    where: { userId: params.userId, status: "AVAILABLE" },
    orderBy: { grantedAt: "asc" },
  });
  let remaining = params.amountCents;
  for (const row of rows) {
    if (remaining <= 0) break;
    if (row.expiresAt && row.expiresAt < new Date()) {
      await prisma.creditLedgerEntry.update({ where: { id: row.id }, data: { status: "EXPIRED" } });
      continue;
    }
    remaining -= row.amountCents;
    await prisma.creditLedgerEntry.update({
      where: { id: row.id },
      data: { status: "CONSUMED", consumedAt: new Date(), reference: params.reference ?? row.reference },
    });
  }
  return { consumed: params.amountCents - Math.max(0, remaining), leftover: Math.max(0, remaining) };
}

export async function creditBalanceCents(userId: string) {
  const rows = await prisma.creditLedgerEntry.findMany({
    where: { userId, status: "AVAILABLE" },
  });
  const now = new Date();
  return rows.filter((r) => !r.expiresAt || r.expiresAt > now).reduce((s, r) => s + r.amountCents, 0);
}
