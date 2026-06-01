import { prisma } from "@ecopet/database";
import type { PaymentMethod, RefundDestination, WalletTransactionType } from "@prisma/client";
import { asOptionalInputJson } from "../lib/prisma-json.js";
import { createAuditLog } from "./audit-service.js";

export async function getOrCreateWallet(userId: string) {
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId, balance: 0 },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
    });
    await prisma.walletLog.create({
      data: { walletId: wallet.id, action: "WALLET_CREATED", metadata: { userId } },
    });
  }
  return wallet;
}

export async function creditWallet(params: {
  userId: string;
  amount: number;
  type: WalletTransactionType;
  description?: string;
  orderId?: string;
  refundId?: string;
  metadata?: Record<string, unknown>;
}) {
  const wallet = await getOrCreateWallet(params.userId);
  const newBalance = wallet.balance + params.amount;

  const [, transaction] = await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: params.type,
        amount: params.amount,
        balanceAfter: newBalance,
        description: params.description,
        orderId: params.orderId,
        refundId: params.refundId,
        metadata: asOptionalInputJson(params.metadata ?? undefined),
      },
    }),
    prisma.walletLog.create({
      data: {
        walletId: wallet.id,
        action: "CREDIT",
        metadata: { amount: params.amount, type: params.type },
      },
    }),
  ]);

  await createAuditLog({
    userId: params.userId,
    action: "UPDATE",
    module: "wallet",
    resource: "transaction",
    resourceId: transaction.id,
    metadata: { type: params.type, amount: params.amount },
  });

  return { balance: newBalance, transaction };
}

export async function debitWallet(params: {
  userId: string;
  amount: number;
  description?: string;
  orderId?: string;
}) {
  return prisma.$transaction(async (tx) => debitWalletTx(tx, params));
}

export async function debitWalletTx(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  params: { userId: string; amount: number; description?: string; orderId?: string }
) {
  let wallet = await tx.wallet.findUnique({ where: { userId: params.userId } });
  if (!wallet) {
    wallet = await tx.wallet.create({ data: { userId: params.userId, balance: 0 } });
  }
  if (wallet.balance < params.amount) {
    throw new Error("Saldo ECOPET insuficiente");
  }
  const newBalance = wallet.balance - params.amount;

  await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });
  const transaction = await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "DEBIT",
      amount: -params.amount,
      balanceAfter: newBalance,
      description: params.description ?? "Pagamento com Saldo ECOPET",
      orderId: params.orderId,
    },
  });
  await tx.walletLog.create({
    data: { walletId: wallet.id, action: "DEBIT", metadata: { amount: params.amount } },
  });

  return { balance: newBalance, transaction };
}

export async function processRefund(params: {
  userId: string;
  orderId: string;
  amount: number;
  originalMethod: PaymentMethod;
  reason?: string;
}) {
  const destination: RefundDestination =
    params.originalMethod === "CARD" ? "CARD" : "WALLET";

  const refund = await prisma.refund.create({
    data: {
      userId: params.userId,
      orderId: params.orderId,
      originalMethod: params.originalMethod,
      destination,
      amount: params.amount,
      reason: params.reason,
      status: destination === "WALLET" ? "PROCESSING" : "PENDING",
    },
  });

  if (destination === "WALLET") {
    await creditWallet({
      userId: params.userId,
      amount: params.amount,
      type: "REFUND",
      description: `Reembolso pedido #${params.orderId.slice(-8)}`,
      orderId: params.orderId,
      refundId: refund.id,
    });
    await prisma.refund.update({
      where: { id: refund.id },
      data: { status: "COMPLETED", processedAt: new Date() },
    });
  } else {
    await createAuditLog({
      userId: params.userId,
      action: "CREATE",
      module: "wallet",
      resource: "refund",
      resourceId: refund.id,
      metadata: { destination: "CARD", amount: params.amount, note: "Estorno solicitado no cartão" },
    });
    await prisma.refund.update({
      where: { id: refund.id },
      data: { status: "PROCESSING" },
    });
  }

  await prisma.systemMetric.create({
    data: { metricKey: "wallet.refund", value: params.amount, metadata: { orderId: params.orderId, destination } },
  });

  return refund;
}

export async function getWalletStatement(userId: string, limit = 50) {
  const wallet = await getOrCreateWallet(userId);
  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const cashbacks = await prisma.cashback.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return { wallet, transactions, cashbacks };
}

export async function generateWalletAiInsights(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentTx = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id, createdAt: { gte: thirtyDaysAgo } },
  });

  const debits = recentTx.filter((t) => t.amount < 0);
  const credits = recentTx.filter((t) => t.amount > 0);
  const totalSpent = debits.reduce((s, t) => s + Math.abs(t.amount), 0);
  const avgSpend = debits.length ? totalSpent / debits.length : 0;

  const insights = [
    {
      id: "spending",
      title: "Análise de gastos (30 dias)",
      description: `Você gastou R$ ${totalSpent.toFixed(2)} em ${debits.length} transações. Média: R$ ${avgSpend.toFixed(2)}.`,
      type: "analysis",
    },
    {
      id: "forecast",
      title: "Previsão de consumo",
      description: avgSpend > 0
        ? `Com base no histórico, estimamos R$ ${(avgSpend * 4).toFixed(2)}/mês em compras ECOPET.`
        : "Sem histórico suficiente para previsão.",
      type: "forecast",
    },
    {
      id: "balance",
      title: "Saldo atual",
      description: wallet.balance > 100
        ? `Saldo saudável de R$ ${wallet.balance.toFixed(2)}. Considere usar em campanhas ou doações.`
        : wallet.balance < 20
          ? `Saldo baixo (R$ ${wallet.balance.toFixed(2)}). Recarregue ou ative cashback.`
          : `Saldo de R$ ${wallet.balance.toFixed(2)} disponível para marketplace e serviços.`,
      type: "alert",
    },
    {
      id: "savings",
      title: "Economia sugerida",
      description: credits.filter((t) => t.type === "CASHBACK").length
        ? "Você já recebeu cashback! Continue comprando de parceiros ECOPET para acumular mais."
        : "Ative cashback em parceiros selecionados e economize até 5% nas próximas compras.",
      type: "suggestion",
    },
  ];

  await prisma.systemMetric.create({
    data: { metricKey: "wallet.ai_insights", value: insights.length, metadata: { userId } },
  });

  return { balance: wallet.balance, totalSpent, insights };
}
