import type { PrismaClient } from "@prisma/client";

export type FinanceCategoryKey =
  | "products"
  | "services"
  | "consultations"
  | "vaccines"
  | "medications"
  | "subscriptions"
  | "donations"
  | "refunds";

export type ClientFinancePanel = {
  month: { start: string; end: string; label: string };
  spentThisMonth: number;
  spentByPet: Array<{ petId: string; petName: string; amount: number }>;
  spentByCategory: Array<{ key: FinanceCategoryKey; label: string; amount: number }>;
  subscriptions: Array<{ id: string; plan: string; active: boolean; expiresAt: string | null }>;
  refunds: { total: number; count: number; items: Array<{ id: string; amount: number; status: string; createdAt: string }> };
  donations: { total: number; count: number };
  budget: { monthly: number | null; remaining: number | null; percentUsed: number | null };
  forecastNextMonth: number;
  monthlyHistory: Array<{ month: string; label: string; amount: number }>;
  recentTransactions: Array<{ id: string; type: string; description: string; amount: number; createdAt: string }>;
};

const CATEGORY_LABELS: Record<FinanceCategoryKey, string> = {
  products: "Produtos",
  services: "Serviços",
  consultations: "Consultas",
  vaccines: "Vacinas",
  medications: "Medicamentos",
  subscriptions: "Assinaturas",
  donations: "Doações",
  refunds: "Reembolsos",
};

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  const label = start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return { start, end, label };
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function categorizeItem(name: string, itemType: string): FinanceCategoryKey {
  const hay = `${name} ${itemType}`.toLowerCase();
  if (/vacin/.test(hay)) return "vaccines";
  if (/medic|remed|antib|vermíf/.test(hay)) return "medications";
  if (/consult|vet|clínica|clinica/.test(hay)) return "consultations";
  if (itemType === "service" || /serviço|servico|banho|tosa|hotel/.test(hay)) return "services";
  return "products";
}

async function loadBudget(prisma: PrismaClient, userId: string): Promise<number | null> {
  const session = await prisma.aiSession.findFirst({
    where: { userId, type: "client:budget" },
    orderBy: { updatedAt: "desc" },
  });
  const payload = (session?.messages ?? {}) as { monthly?: number };
  return typeof payload.monthly === "number" && payload.monthly > 0 ? payload.monthly : null;
}

export async function buildClientFinancePanel(prisma: PrismaClient, userId: string): Promise<ClientFinancePanel> {
  const range = monthRange();
  const pets = await prisma.pet.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true, name: true },
  });
  const petIds = pets.map((p) => p.id);
  const petMap = new Map(pets.map((p) => [p.id, p.name]));

  const historyStart = new Date();
  historyStart.setMonth(historyStart.getMonth() - 5);
  historyStart.setDate(1);
  historyStart.setHours(0, 0, 0, 0);

  const [orders, appointments, subscriptions, refunds, budgetMonthly, wallet] = await Promise.all([
    prisma.order.findMany({
      where: { userId, createdAt: { gte: historyStart } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    petIds.length
      ? prisma.appointment.findMany({
          where: { userId, petId: { in: petIds }, scheduledAt: { gte: historyStart } },
          include: { service: { select: { price: true, name: true, category: true } }, pet: { select: { id: true, name: true } } },
        })
      : Promise.resolve([]),
    prisma.subscription.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.refund.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
    loadBudget(prisma, userId),
    prisma.wallet.findUnique({ where: { userId }, include: { transactions: { orderBy: { createdAt: "desc" }, take: 10 } } }),
  ]);

  const monthOrders = orders.filter((o) => o.createdAt >= range.start && o.createdAt <= range.end);
  const spentThisMonth = monthOrders.reduce((s, o) => s + o.total, 0);

  const categoryTotals: Record<FinanceCategoryKey, number> = {
    products: 0,
    services: 0,
    consultations: 0,
    vaccines: 0,
    medications: 0,
    subscriptions: 0,
    donations: 0,
    refunds: 0,
  };

  const petTotals = new Map<string, number>();
  for (const p of pets) petTotals.set(p.id, 0);

  for (const o of monthOrders) {
    for (const item of o.items) {
      const cat = categorizeItem(item.name, item.itemType);
      const amount = item.price * item.quantity;
      categoryTotals[cat] += amount;
    }
  }

  for (const a of appointments) {
    if (a.scheduledAt < range.start || a.scheduledAt > range.end) continue;
    const price = a.service?.price ?? 0;
    if (price <= 0) continue;
    const cat =
      a.service?.category === "VETERINARY" ||
      a.service?.category === "VET_CONSULTATION" ||
      /consult/i.test(a.service?.name ?? "")
        ? "consultations"
        : "services";
    categoryTotals[cat] += price;
    const prev = petTotals.get(a.petId) ?? 0;
    petTotals.set(a.petId, prev + price);
  }

  const refundMonth = refunds.filter((r) => r.createdAt >= range.start && r.createdAt <= range.end);
  categoryTotals.refunds = refundMonth.reduce((s, r) => s + r.amount, 0);

  const spentByPet = [...petTotals.entries()]
    .map(([petId, amount]) => ({ petId, petName: petMap.get(petId) ?? "Pet", amount }))
    .filter((p) => p.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const spentByCategory = (Object.keys(categoryTotals) as FinanceCategoryKey[])
    .map((key) => ({ key, label: CATEGORY_LABELS[key], amount: categoryTotals[key] }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const monthlyHistory: Array<{ month: string; label: string; amount: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const amount = orders
      .filter((o) => o.createdAt >= mStart && o.createdAt <= mEnd)
      .reduce((s, o) => s + o.total, 0);
    monthlyHistory.push({ month: mStart.toISOString(), label: monthLabel(mStart), amount });
  }

  const avg =
    monthlyHistory.length > 0
      ? monthlyHistory.reduce((s, m) => s + m.amount, 0) / monthlyHistory.length
      : 0;

  const budgetRemaining = budgetMonthly != null ? Math.max(budgetMonthly - spentThisMonth, 0) : null;
  const budgetPercent =
    budgetMonthly != null && budgetMonthly > 0 ? Math.min((spentThisMonth / budgetMonthly) * 100, 100) : null;

  const recentTransactions =
    wallet?.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      description: t.description ?? "Movimentação na carteira",
      amount: t.amount,
      createdAt: t.createdAt.toISOString(),
    })) ?? [];

  return {
    month: { start: range.start.toISOString(), end: range.end.toISOString(), label: range.label },
    spentThisMonth,
    spentByPet,
    spentByCategory,
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      plan: s.plan,
      active: s.active,
      expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
    })),
    refunds: {
      total: refunds.reduce((s, r) => s + r.amount, 0),
      count: refunds.length,
      items: refunds.map((r) => ({
        id: r.id,
        amount: r.amount,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    },
    donations: { total: 0, count: 0 },
    budget: { monthly: budgetMonthly, remaining: budgetRemaining, percentUsed: budgetPercent },
    forecastNextMonth: Math.round(avg * 100) / 100,
    monthlyHistory,
    recentTransactions,
  };
}

export function buildFinanceAiContext(panel: ClientFinancePanel): string {
  const topPet = panel.spentByPet[0];
  const topCat = panel.spentByCategory[0];
  return [
    `Gastos do mês: R$ ${panel.spentThisMonth.toFixed(2)}`,
    topPet ? `Pet com maior custo: ${topPet.petName} (R$ ${topPet.amount.toFixed(2)})` : "Sem gastos por pet no mês",
    topCat ? `Maior categoria: ${topCat.label} (R$ ${topCat.amount.toFixed(2)})` : "Sem categorias no mês",
    `Previsão próximo mês: R$ ${panel.forecastNextMonth.toFixed(2)}`,
    panel.budget.monthly != null ? `Orçamento mensal: R$ ${panel.budget.monthly.toFixed(2)}` : "Orçamento não definido",
    `Reembolsos no período: R$ ${panel.refunds.total.toFixed(2)}`,
  ].join("\n");
}
