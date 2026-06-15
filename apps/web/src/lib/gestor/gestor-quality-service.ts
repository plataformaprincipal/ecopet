import { AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getIntegrationHealthReport } from "@/lib/integrations/health";

const PENDING_DAYS_THRESHOLD = 7;

export async function getGestorQuality() {
  const pendingSince = new Date();
  pendingSince.setDate(pendingSince.getDate() - PENDING_DAYS_THRESHOLD);
  const now = new Date();

  const [
    stalePendingUsers,
    partnersNoCatalog,
    productsNoStock,
    servicesInactive,
    openTicketsNoAssignee,
    staleReports,
    integrationErrors,
    stuckOrders,
    overdueAppointments,
  ] = await Promise.all([
    prisma.user.count({
      where: { accountStatus: AccountStatus.PENDING, createdAt: { lt: pendingSince } },
    }),
    prisma.user.count({
      where: {
        role: UserRole.PARTNER,
        accountStatus: AccountStatus.ACTIVE,
        products: { none: { deletedAt: null } },
        services: { none: { deletedAt: null } },
      },
    }),
    prisma.product.count({ where: { deletedAt: null, status: "ACTIVE", stock: 0 } }),
    prisma.service.count({ where: { deletedAt: null, isActive: false } }),
    prisma.supportTicket.count({ where: { status: "OPEN", assigneeId: null } }),
    prisma.socialReport.count({ where: { status: "OPEN", createdAt: { lt: pendingSince } } }),
    prisma.platformIntegrationLog.count({
      where: { status: { in: ["ERROR", "FAILED"] }, createdAt: { gte: pendingSince } },
    }),
    prisma.order.count({
      where: { status: { in: ["PENDING", "PROCESSING", "CONFIRMED"] }, updatedAt: { lt: pendingSince } },
    }),
    prisma.appointment.count({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        scheduledAt: { lt: now },
      },
    }),
  ]);

  const integrationHealth = await getIntegrationHealthReport();
  const brokenIntegrations = integrationHealth.integrations.filter((i) => i.status === "ERROR");

  const alerts = [
    {
      id: "stale_pending_users",
      severity: stalePendingUsers > 0 ? "warning" : "ok",
      label: `Usuários pendentes há mais de ${PENDING_DAYS_THRESHOLD} dias`,
      count: stalePendingUsers,
    },
    {
      id: "partners_no_catalog",
      severity: partnersNoCatalog > 0 ? "warning" : "ok",
      label: "Parceiros ativos sem produto ou serviço",
      count: partnersNoCatalog,
    },
    {
      id: "products_no_stock",
      severity: productsNoStock > 0 ? "warning" : "ok",
      label: "Produtos ativos sem estoque",
      count: productsNoStock,
    },
    {
      id: "services_inactive",
      severity: servicesInactive > 0 ? "info" : "ok",
      label: "Serviços inativos cadastrados",
      count: servicesInactive,
    },
    {
      id: "tickets_unassigned",
      severity: openTicketsNoAssignee > 0 ? "critical" : "ok",
      label: "Tickets abertos sem responsável",
      count: openTicketsNoAssignee,
    },
    {
      id: "stale_reports",
      severity: staleReports > 0 ? "warning" : "ok",
      label: `Denúncias abertas há mais de ${PENDING_DAYS_THRESHOLD} dias`,
      count: staleReports,
    },
    {
      id: "integration_errors",
      severity: integrationErrors > 0 || brokenIntegrations.length > 0 ? "critical" : "ok",
      label: "Integrações com erro recente",
      count: integrationErrors + brokenIntegrations.length,
      details: brokenIntegrations.map((i) => i.name),
    },
    {
      id: "stuck_orders",
      severity: stuckOrders > 0 ? "warning" : "ok",
      label: "Pedidos parados em status intermediário",
      count: stuckOrders,
    },
    {
      id: "overdue_appointments",
      severity: overdueAppointments > 0 ? "warning" : "ok",
      label: "Agendamentos vencidos sem conclusão",
      count: overdueAppointments,
    },
  ];

  return {
    thresholdDays: PENDING_DAYS_THRESHOLD,
    alerts,
    checkedAt: new Date().toISOString(),
  };
}
