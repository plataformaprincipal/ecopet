import { prisma } from "@ecopet/database";
import type { ApprovalStatus, ApprovalType } from "@prisma/client";
import { markSlaResponded, markSlaResolved } from "./sla-service.js";

export async function getGestorDashboardMetrics() {
  const [
    totalUsers,
    activePartners,
    activeNgos,
    totalPets,
    activeProducts,
    activeServices,
    pendingApprovals,
    openTickets,
    totalOrders,
    paidOrders,
    totalPosts,
    hiddenPosts,
    pendingReports,
    activeIntegrations,
    recurringRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        role: { in: ["PETSHOP", "SELLER", "SERVICE_PROVIDER", "VETERINARIAN", "CLINIC", "PARTNER"] },
        accountStatus: "ACTIVE",
      },
    }),
    prisma.user.count({ where: { role: "ONG", accountStatus: "ACTIVE" } }),
    prisma.pet.count(),
    prisma.product.count({ where: { approvalStatus: "APPROVED" } }),
    prisma.service.count({ where: { isActive: true, approvalStatus: "APPROVED" } }),
    prisma.approvalRequest.count({ where: { status: "PENDING" } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } } }),
    prisma.order.count(),
    prisma.order.aggregate({ where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "PICKED_UP"] } }, _sum: { total: true } }),
    prisma.post.count(),
    prisma.post.count({ where: { isHidden: true } }),
    prisma.contentReport.count({ where: { status: "PENDING" } }),
    prisma.integration.count({ where: { status: "CONNECTED" } }),
    prisma.subscription.count({ where: { active: true, plan: { not: "FREE" } } }),
  ]);

  const newUsersWeek = await prisma.user.count({
    where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  });

  const engagement = await prisma.like.count();
  const walletTotal = await prisma.wallet.aggregate({ _sum: { balance: true } });
  const openChats = await prisma.conversation.count({ where: { status: "OPEN" } });
  const activeRobots = await prisma.operationalRobot.count({ where: { isActive: true, profileType: "GESTOR" } });
  const errorIntegrations = await prisma.integration.count({ where: { status: "ERROR" } });
  const quotes = await prisma.customQuote.count();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeClients = await prisma.user.count({ where: { role: "TUTOR", accountStatus: "ACTIVE", updatedAt: { gte: weekAgo } } });

  return {
    revenue: {
      total: paidOrders._sum.total ?? 0,
      recurring: recurringRevenue * 29.9,
    },
    wallet: { totalBalance: walletTotal._sum.balance ?? 0 },
    users: { total: totalUsers, newThisWeek: newUsersWeek, activeClients },
    partners: { active: activePartners },
    ngos: { active: activeNgos },
    pets: { total: totalPets },
    marketplace: {
      products: activeProducts,
      services: activeServices,
      orders: totalOrders,
      quotes,
    },
    operations: {
      pendingApprovals,
      openTickets,
      pendingReports,
      hiddenPosts,
      openChats,
      errorIntegrations,
      activeRobots,
    },
    social: {
      posts: totalPosts,
      engagement,
      retention: activeClients > 0 ? Math.round((activeClients / totalUsers) * 100) : 0,
    },
    integrations: { active: activeIntegrations, errors: errorIntegrations },
    growth: { weekly: newUsersWeek, marketplaceOrders: totalOrders },
    aiInsights: [
      {
        id: "1",
        tag: "Executivo",
        title: "Resumo do dia",
        description: `${pendingApprovals} aprovações, ${openTickets} tickets, ${pendingReports} denúncias pendentes.`,
        priority: pendingApprovals > 5 ? "high" : "medium",
      },
      {
        id: "2",
        tag: "Risco",
        title: errorIntegrations > 0 ? `${errorIntegrations} integrações com erro` : "Integrações estáveis",
        description: errorIntegrations > 0 ? "Verifique /gestor/integracoes imediatamente." : "Todas as integrações operacionais.",
        priority: errorIntegrations > 0 ? "high" : "low",
      },
      {
        id: "3",
        tag: "Oportunidade",
        title: `Saldo ECOPET: R$ ${(walletTotal._sum.balance ?? 0).toFixed(2)}`,
        description: "Carteira digital crescendo — considere campanhas de cashback.",
        priority: "medium",
      },
      {
        id: "4",
        tag: "Urgente",
        title: pendingReports > 0 ? `${pendingReports} denúncias aguardando triagem` : "Moderação em dia",
        priority: pendingReports > 0 ? "high" : "low",
      },
      {
        id: "5",
        tag: "Ação",
        title: `${activeRobots} robôs operacionais ativos`,
        description: "Central de robôs monitorando marketplace, financeiro e qualidade 24h.",
        priority: "low",
      },
    ],
  };
}

export async function listApprovalRequests(status?: ApprovalStatus, type?: ApprovalType) {
  return prisma.approvalRequest.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { id: true, name: true, email: true, role: true } },
      reviewer: { select: { id: true, name: true } },
    },
    take: 100,
  });
}

export async function reviewApproval(
  id: string,
  reviewerId: string,
  status: "APPROVED" | "REJECTED" | "REVISION",
  notes?: string
) {
  const approval = await prisma.approvalRequest.update({
    where: { id },
    data: { status, reviewerId, notes, reviewedAt: new Date() },
  });

  if (status === "APPROVED") {
    if (approval.type === "CLIENT" || approval.type === "PARTNER" || approval.type === "ONG") {
      await prisma.user.update({
        where: { id: approval.entityId },
        data: { accountStatus: "ACTIVE" },
      });
    }
    if (approval.type === "PRODUCT") {
      await prisma.product.update({
        where: { id: approval.entityId },
        data: { approvalStatus: "APPROVED" },
      });
    }
    if (approval.type === "SERVICE") {
      await prisma.service.update({
        where: { id: approval.entityId },
        data: { approvalStatus: "APPROVED" },
      });
    }
  }

  if (status === "REJECTED") {
    if (approval.type === "CLIENT" || approval.type === "PARTNER" || approval.type === "ONG") {
      await prisma.user.update({
        where: { id: approval.entityId },
        data: { accountStatus: "REJECTED" },
      });
    }
    if (approval.type === "PRODUCT") {
      await prisma.product.update({ where: { id: approval.entityId }, data: { approvalStatus: "REJECTED" } });
    }
    if (approval.type === "SERVICE") {
      await prisma.service.update({ where: { id: approval.entityId }, data: { approvalStatus: "REJECTED" } });
    }
  }

  return approval;
}

export async function listPendingUsers() {
  return prisma.user.findMany({
    where: { accountStatus: "PENDING" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      cpf: true,
      phone: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listModerationReports(status = "PENDING") {
  return prisma.contentReport.findMany({
    where: { status: status as "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true } },
    },
    take: 100,
  });
}

export async function resolveReport(
  id: string,
  reviewerId: string,
  action: string,
  status: "RESOLVED" | "DISMISSED"
) {
  await markSlaResponded("content_report", id, reviewerId);

  const report = await prisma.contentReport.update({
    where: { id },
    data: { reviewerId, action, status, resolvedAt: new Date() },
  });

  await markSlaResolved("content_report", id, reviewerId);

  if (action === "hide" && report.targetType === "POST") {
    await prisma.post.update({
      where: { id: report.targetId },
      data: { isHidden: true, isModerated: true, moderationNotes: action },
    });
  }
  if (action === "delete" && report.targetType === "POST") {
    await prisma.post.delete({ where: { id: report.targetId } }).catch(() => null);
  }

  return report;
}
