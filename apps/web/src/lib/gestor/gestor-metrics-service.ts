import { AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { GestorFilters } from "@/lib/gestor/gestor-filters";
import { dateRangeWhere } from "@/lib/gestor/gestor-filters";
import { getIntegrationHealthReport } from "@/lib/integrations/health";
import { sanitizeMetadata, redactSecretLikeText } from "@/lib/gestor/gestor-utils";
import { getObservabilityProviders } from "@/lib/observability/providers";

export async function getGestorOverview(_filters: GestorFilters) {
  const [
    totalUsers,
    usersByRole,
    usersByStatus,
    pendingPartners,
    pendingOngs,
    petsCount,
    activeProducts,
    activeServices,
    ordersCount,
    ordersByStatus,
    appointmentsByStatus,
    openTickets,
    openReports,
    messagesCount,
    postsCount,
    integrationHealth,
    criticalLogs,
    recentAudit,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["accountStatus"], _count: { _all: true } }),
    prisma.user.count({ where: { role: UserRole.PARTNER, accountStatus: AccountStatus.PENDING } }),
    prisma.user.count({ where: { role: UserRole.ONG, accountStatus: AccountStatus.PENDING } }),
    prisma.pet.count(),
    prisma.product.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.service.count({ where: { deletedAt: null, isActive: true, status: "ACTIVE" } }),
    prisma.order.count(),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.appointment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING", "WAITING_USER"] } } }),
    prisma.socialReport.count({ where: { status: "OPEN" } }),
    prisma.message.count(),
    prisma.socialPost.count({ where: { deletedAt: null } }),
    getIntegrationHealthReport(),
    prisma.platformIntegrationLog.findMany({
      where: { status: { in: ["ERROR", "FAILED"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        integrationName: true,
        provider: true,
        action: true,
        status: true,
        message: true,
        createdAt: true,
        metadata: true,
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        module: true,
        resource: true,
        observation: true,
        createdAt: true,
        metadata: true,
      },
    }),
  ]);

  const integrationSummary = {
    ACTIVE: integrationHealth.integrations.filter((i) => i.status === "ACTIVE").length,
    NOT_CONFIGURED: integrationHealth.integrations.filter((i) => i.status === "NOT_CONFIGURED").length,
    ERROR: integrationHealth.integrations.filter((i) => i.status === "ERROR").length,
  };

  const activeUsers = usersByStatus.find((s) => s.accountStatus === AccountStatus.ACTIVE)?._count._all ?? 0;
  const pendingUsers = usersByStatus.find((s) => s.accountStatus === AccountStatus.PENDING)?._count._all ?? 0;

  return {
    metrics: [
      { key: "users_total", label: "Usuários", value: totalUsers },
      { key: "users_active", label: "Usuários ativos", value: activeUsers },
      { key: "users_pending", label: "Usuários pendentes", value: pendingUsers },
      { key: "partners_pending", label: "Parceiros pendentes", value: pendingPartners },
      { key: "ongs_pending", label: "ONGs pendentes", value: pendingOngs },
      { key: "pets", label: "Pets cadastrados", value: petsCount },
      { key: "products_active", label: "Produtos ativos", value: activeProducts },
      { key: "services_active", label: "Serviços ativos", value: activeServices },
      { key: "orders", label: "Pedidos criados", value: ordersCount },
      { key: "tickets_open", label: "Tickets abertos", value: openTickets },
      { key: "reports_open", label: "Denúncias abertas", value: openReports },
      { key: "messages", label: "Mensagens enviadas", value: messagesCount },
      { key: "posts", label: "Posts criados", value: postsCount },
    ],
    usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count._all })),
    usersByStatus: usersByStatus.map((s) => ({ status: s.accountStatus, count: s._count._all })),
    ordersByStatus: ordersByStatus.map((o) => ({ status: o.status, count: o._count._all })),
    appointmentsByStatus: appointmentsByStatus.map((a) => ({ status: a.status, count: a._count._all })),
    integrations: integrationSummary,
    criticalLogs: criticalLogs.map((l) => ({
      ...l,
      metadata: sanitizeMetadata(l.metadata),
      createdAt: l.createdAt.toISOString(),
    })),
    recentAudit: recentAudit.map((l) => ({
      ...l,
      metadata: sanitizeMetadata(l.metadata),
      createdAt: l.createdAt.toISOString(),
    })),
    checkedAt: new Date().toISOString(),
  };
}

export async function getGestorSystemHealth() {
  let databaseConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseConnected = true;
  } catch {
    databaseConnected = false;
  }

  const [criticalLogCount, integrationHealth] = await Promise.all([
    prisma.platformIntegrationLog.count({ where: { status: { in: ["ERROR", "FAILED"] } } }),
    getIntegrationHealthReport(),
  ]);

  return {
    databaseConnected,
    migrationsApplied: databaseConnected,
    appVersion: process.env.npm_package_version ?? process.env.NEXT_PUBLIC_APP_VERSION ?? null,
    checkedAt: new Date().toISOString(),
    criticalLogCount,
    integrations: integrationHealth.integrations.map((i) => ({
      name: i.name,
      provider: i.provider,
      status: i.status,
      message: redactSecretLikeText(i.message),
      lastCheckedAt: i.lastCheckedAt,
    })),
    recentErrors: integrationHealth.recentLogs
      .filter((l) => l.status === "ERROR" || l.status === "FAILED")
      .slice(0, 10)
      .map((l) => ({
        integrationName: l.integrationName,
        status: l.status,
        message: redactSecretLikeText(l.message ?? undefined),
        createdAt: l.createdAt,
      })),
    healthEndpoint: { path: "/api/health", available: true },
    observability: getObservabilityProviders(),
  };
}
