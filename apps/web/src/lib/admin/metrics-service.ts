import { AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Métricas do dashboard /admin — dados reais do banco. */
export async function getAdminDashboardMetrics() {
  const [
    totalUsers,
    activeClients,
    pendingPartners,
    approvedPartners,
    pendingOngs,
    approvedOngs,
    productsCount,
    ordersCount,
    openReports,
    appointmentsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.CLIENT, accountStatus: AccountStatus.ACTIVE } }),
    prisma.user.count({ where: { role: UserRole.PARTNER, accountStatus: AccountStatus.PENDING } }),
    prisma.user.count({ where: { role: UserRole.PARTNER, accountStatus: AccountStatus.ACTIVE } }),
    prisma.user.count({ where: { role: UserRole.ONG, accountStatus: AccountStatus.PENDING } }),
    prisma.user.count({ where: { role: UserRole.ONG, accountStatus: AccountStatus.ACTIVE } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.order.count(),
    prisma.socialReport.count({ where: { status: "OPEN" } }),
    prisma.appointment.count(),
  ]);

  return [
    { key: "users_total", label: "Usuários totais", value: totalUsers },
    { key: "clients_active", label: "Clientes ativos", value: activeClients },
    { key: "partners_pending", label: "Parceiros pendentes", value: pendingPartners },
    { key: "partners_approved", label: "Parceiros aprovados", value: approvedPartners },
    { key: "ongs_pending", label: "ONGs pendentes", value: pendingOngs },
    { key: "ongs_approved", label: "ONGs aprovadas", value: approvedOngs },
    { key: "products", label: "Produtos cadastrados", value: productsCount },
    { key: "orders", label: "Pedidos totais", value: ordersCount },
    { key: "reports_open", label: "Denúncias pendentes", value: openReports },
    { key: "appointments", label: "Agendamentos totais", value: appointmentsCount },
  ];
}
