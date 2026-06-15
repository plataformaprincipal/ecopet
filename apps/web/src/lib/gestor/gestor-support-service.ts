import { prisma } from "@/lib/prisma";
import type { GestorFilters } from "@/lib/gestor/gestor-filters";
import { dateRangeWhere, paginationArgs } from "@/lib/gestor/gestor-filters";
import { getIntegrationHealthReport } from "@/lib/integrations/health";

export async function getGestorSupport(filters: GestorFilters) {
  const dateWhere = dateRangeWhere(filters);
  const openStatuses = ["OPEN", "IN_PROGRESS", "WAITING", "WAITING_USER"] as const;
  const [open, inProgress, closed, byCategory, byPriority, items, total] = await Promise.all([
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.supportTicket.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }),
    prisma.supportTicket.groupBy({ by: ["category"], _count: { _all: true }, where: dateWhere }),
    prisma.supportTicket.groupBy({ by: ["priority"], _count: { _all: true }, where: dateWhere }),
    prisma.supportTicket.findMany({
      where: {
        ...dateWhere,
        ...(filters.status ? { status: filters.status as "OPEN" | "IN_PROGRESS" | "CLOSED" } : {}),
      },
      select: {
        id: true,
        number: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true,
        requester: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
    }),
    prisma.supportTicket.count({
      where: {
        ...dateWhere,
        ...(filters.status ? { status: filters.status as "OPEN" | "IN_PROGRESS" | "CLOSED" } : {}),
      },
    }),
  ]);

  return {
    metrics: [
      { key: "open", label: "Abertos", value: open },
      { key: "in_progress", label: "Em andamento", value: inProgress },
      { key: "closed", label: "Fechados", value: closed },
    ],
    byCategory: byCategory.map((c) => ({ category: c.category, count: c._count._all })),
    byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count._all })),
    slaAvailable: false,
    slaMessage: "SLA não disponível — dados insuficientes para cálculo de tempo médio de resposta.",
    items: items.map((t) => ({
      id: t.id,
      number: t.number,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      requesterName: t.requester.name,
      requesterEmail: t.requester.email,
      createdAt: t.createdAt.toISOString(),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
  };
}

export async function getGestorMessages(filters: GestorFilters) {
  const dateWhere = dateRangeWhere(filters);
  const [conversations, messages, messageReports] = await Promise.all([
    prisma.conversation.count({ where: dateWhere }),
    prisma.message.count({ where: dateWhere }),
    prisma.messageReport.count(),
  ]);

  const recent = await prisma.message.findMany({
    where: dateWhere,
    select: {
      id: true,
      content: true,
      createdAt: true,
      sender: { select: { name: true } },
      conversation: { select: { id: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
    ...paginationArgs(filters),
  });

  const total = await prisma.message.count({ where: dateWhere });

  return {
    metrics: [
      { key: "conversations", label: "Conversas criadas", value: conversations },
      { key: "messages", label: "Mensagens enviadas", value: messages },
      { key: "message_reports", label: "Denúncias de mensagens", value: messageReports },
    ],
    items: recent.map((m) => ({
      id: m.id,
      preview: m.content.slice(0, 120),
      senderName: m.sender.name,
      conversationType: m.conversation.type,
      conversationId: m.conversation.id,
      createdAt: m.createdAt.toISOString(),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
  };
}

export async function getGestorIntegrations() {
  const report = await getIntegrationHealthReport();
  const emailLogs = await prisma.emailLog.count();
  return {
    integrations: report.integrations,
    recentLogs: report.recentLogs,
    emailLogsCount: emailLogs,
    checkedAt: report.checkedAt,
    environment: report.environment,
  };
}

export async function getGestorFinance(filters: GestorFilters) {
  const dateWhere = dateRangeWhere(filters);
  const [ordersByStatus, volume, paymentsByStatus, paymentEvents] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true }, where: dateWhere }),
    prisma.order.aggregate({ where: dateWhere, _sum: { total: true }, _avg: { total: true }, _count: { _all: true } }),
    prisma.payment.groupBy({ by: ["status"], _count: { _all: true }, where: dateWhere }),
    prisma.paymentEvent.count({ where: dateWhere }),
  ]);

  const gatewayConfigured = Boolean(
    process.env.MERCADOPAGO_ACCESS_TOKEN ||
      process.env.PAGARME_API_KEY ||
      process.env.STRIPE_SECRET_KEY
  );

  return {
    metrics: [
      { key: "orders_total", label: "Pedidos registrados", value: volume._count._all },
      {
        key: "gross_volume",
        label: "Volume bruto registrado",
        value: Math.round((volume._sum.total ?? 0) * 100) / 100,
      },
      {
        key: "avg_ticket",
        label: "Ticket médio registrado",
        value: Math.round((volume._avg.total ?? 0) * 100) / 100,
      },
      { key: "payment_events", label: "Eventos de pagamento", value: paymentEvents },
    ],
    ordersByStatus: ordersByStatus.map((o) => ({ status: o.status, count: o._count._all })),
    paymentsByStatus: paymentsByStatus.map((p) => ({ status: p.status, count: p._count._all })),
    gatewayConfigured,
    disclaimer: gatewayConfigured
      ? "Pagamentos listados refletem registros no banco; confirmação depende do webhook do provedor."
      : "Gateway de pagamento não configurado — métricas financeiras baseadas apenas em pedidos registrados.",
  };
}
