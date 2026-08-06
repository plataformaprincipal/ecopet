import "server-only";

import type { LedgerAccountType, Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

const PLATFORM_TYPES: LedgerAccountType[] = [
  "PLATFORM_REVENUE",
  "PLATFORM_RECEIVABLE",
  "GATEWAY_FEES",
  "RESERVE",
  "REFUNDS",
  "CHARGEBACKS",
  "TAX_ESTIMATE",
];

export async function ensurePlatformAccounts(tx: Tx, currency = "BRL") {
  for (const type of PLATFORM_TYPES) {
    await tx.ledgerAccount.upsert({
      where: {
        type_ownerKey_currency: { type, ownerKey: "platform", currency },
      },
      create: {
        type,
        ownerKey: "platform",
        partnerId: null,
        currency,
        name: `Platform ${type}`,
      },
      update: { isActive: true },
    });
  }
}

export async function ensurePartnerAccounts(tx: Tx, partnerId: string, currency = "BRL") {
  const types: LedgerAccountType[] = ["PARTNER_PAYABLE", "RESERVE", "REFUNDS", "CHARGEBACKS"];
  for (const type of types) {
    await tx.ledgerAccount.upsert({
      where: {
        type_ownerKey_currency: { type, ownerKey: partnerId, currency },
      },
      create: {
        type,
        ownerKey: partnerId,
        partnerId,
        currency,
        name: `Partner ${partnerId.slice(0, 8)} ${type}`,
      },
      update: { isActive: true },
    });
  }
}

export async function getAccount(
  tx: Tx,
  type: LedgerAccountType,
  ownerKey: string,
  currency = "BRL"
) {
  const acc = await tx.ledgerAccount.findUnique({
    where: { type_ownerKey_currency: { type, ownerKey, currency } },
  });
  if (!acc) throw new Error(`ACCOUNT_MISSING_${type}`);
  return acc;
}
