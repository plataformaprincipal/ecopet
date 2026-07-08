import { AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { GestorFilters } from "@/lib/gestor/gestor-filters";
import { dateRangeWhere, paginationArgs } from "@/lib/gestor/gestor-filters";
import { maskCpf, maskCnpj } from "@/lib/gestor/gestor-utils";
import { auditReactivation, auditSuspension } from "@/lib/auth/auth-audit";

function userWhere(filters: GestorFilters) {
  return {
    ...dateRangeWhere(filters),
    ...(filters.role ? { role: filters.role as UserRole } : {}),
    ...(filters.status ? { accountStatus: filters.status as AccountStatus } : {}),
    ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" as const } } : {}),
    ...(filters.state ? { state: filters.state.toUpperCase() } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" as const } },
            { email: { contains: filters.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

export async function getGestorUsers(filters: GestorFilters) {
  const where = userWhere(filters);
  const [total, users, statusCounts, roleCounts] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        city: true,
        state: true,
        cpf: true,
        createdAt: true,
        _count: { select: { pets: true, orders: true, socialPostsAuthored: true } },
      },
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
    }),
    prisma.user.groupBy({ by: ["accountStatus"], _count: { _all: true }, where }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true }, where }),
  ]);

  const userIds = users.map((u) => u.id);
  const lastLogins = userIds.length
    ? await prisma.loginLog.groupBy({
        by: ["userId"],
        _max: { createdAt: true },
        where: { userId: { in: userIds }, success: true },
      })
    : [];
  const loginMap = new Map(lastLogins.map((l) => [l.userId, l._max.createdAt]));

  return {
    metrics: [
      { key: "total", label: "Total", value: total },
      ...statusCounts.map((s) => ({
        key: `status_${s.accountStatus}`,
        label: s.accountStatus,
        value: s._count._all,
      })),
    ],
    roleCounts: roleCounts.map((r) => ({ role: r.role, count: r._count._all })),
    items: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      accountStatus: u.accountStatus,
      city: u.city,
      state: u.state,
      cpfMasked: maskCpf(u.cpf),
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: loginMap.get(u.id)?.toISOString() ?? null,
      petsCount: u._count.pets,
      ordersCount: u._count.orders,
      postsCount: u._count.socialPostsAuthored,
    })),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit) || 1,
    },
  };
}

export async function updateGestorUserStatus(params: {
  userId: string;
  action: "suspend" | "reactivate";
  adminId: string;
  reason?: string;
}) {
  if (params.userId === params.adminId) {
    throw new Error("SELF_ACTION");
  }

  const target = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!target) throw new Error("NOT_FOUND");

  const before = { accountStatus: target.accountStatus, accountStatusReason: target.accountStatusReason };
  const nextStatus = params.action === "suspend" ? AccountStatus.SUSPENDED : AccountStatus.ACTIVE;

  await prisma.user.update({
    where: { id: params.userId },
    data: {
      accountStatus: nextStatus,
      accountStatusReason: params.reason ?? null,
    },
  });

  if (params.action === "suspend") {
    await auditSuspension({
      actorId: params.adminId,
      targetUserId: params.userId,
      before,
      after: { accountStatus: nextStatus, accountStatusReason: params.reason ?? null },
      reason: params.reason,
    });
  } else {
    await auditReactivation({
      actorId: params.adminId,
      targetUserId: params.userId,
      before,
      after: { accountStatus: nextStatus, accountStatusReason: params.reason ?? null },
      reason: params.reason,
    });
  }

  return { userId: params.userId, accountStatus: nextStatus };
}

export async function getGestorPartners(filters: GestorFilters) {
  const where = {
    role: UserRole.PARTNER,
    ...dateRangeWhere(filters),
    ...(filters.status ? { accountStatus: filters.status as AccountStatus } : {}),
    ...(filters.city || filters.state
      ? {
          partnerProfile: {
            ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" as const } } : {}),
            ...(filters.state ? { state: filters.state.toUpperCase() } : {}),
          },
        }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" as const } },
            { email: { contains: filters.q, mode: "insensitive" as const } },
            { partnerProfile: { businessName: { contains: filters.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [total, partners, statusCounts] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        accountStatus: true,
        createdAt: true,
        partnerProfile: { select: { cnpj: true, city: true, state: true, businessName: true } },
        _count: {
          select: {
            products: { where: { deletedAt: null, status: "ACTIVE" } },
            services: { where: { deletedAt: null, isActive: true } },
            partnerOrders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
    }),
    prisma.user.groupBy({
      by: ["accountStatus"],
      _count: { _all: true },
      where: { role: UserRole.PARTNER },
    }),
  ]);

  const partnerIds = partners.map((p) => p.id);
  const reportRows = partnerIds.length
    ? await prisma.socialReport.findMany({
        where: { post: { authorId: { in: partnerIds } } },
        select: { post: { select: { authorId: true } } },
      })
    : [];
  const reportMap = new Map<string, number>();
  for (const row of reportRows) {
    const aid = row.post?.authorId;
    if (aid) reportMap.set(aid, (reportMap.get(aid) ?? 0) + 1);
  }

  return {
    metrics: statusCounts.map((s) => ({
      key: s.accountStatus,
      label: s.accountStatus,
      value: s._count._all,
    })),
    items: partners.map((p) => ({
      userId: p.id,
      name: p.partnerProfile?.businessName ?? p.name,
      email: p.email,
      accountStatus: p.accountStatus,
      cnpjMasked: maskCnpj(p.partnerProfile?.cnpj ?? null),
      city: p.partnerProfile?.city ?? null,
      state: p.partnerProfile?.state ?? null,
      productsCount: p._count.products,
      servicesCount: p._count.services,
      ordersCount: p._count.partnerOrders,
      avgRating: null,
      reportsCount: reportMap.get(p.id) ?? 0,
      createdAt: p.createdAt.toISOString(),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
  };
}

export async function getGestorOngs(filters: GestorFilters) {
  const where = {
    role: UserRole.ONG,
    ...dateRangeWhere(filters),
    ...(filters.status ? { accountStatus: filters.status as AccountStatus } : {}),
    ...(filters.city || filters.state
      ? {
          ongProfile: {
            ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" as const } } : {}),
            ...(filters.state ? { state: filters.state.toUpperCase() } : {}),
          },
        }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" as const } },
            { ongProfile: { ongName: { contains: filters.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [total, ongs, statusCounts] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        accountStatus: true,
        createdAt: true,
        ongProfile: { select: { ongName: true, cnpj: true, city: true, state: true } },
        _count: { select: { socialPostsAuthored: true } },
      },
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
    }),
    prisma.user.groupBy({
      by: ["accountStatus"],
      _count: { _all: true },
      where: { role: UserRole.ONG },
    }),
  ]);

  const ongIds = ongs.map((o) => o.id);
  const [reportRows, conversations] = await Promise.all([
    ongIds.length
      ? prisma.socialReport.findMany({
          where: { post: { authorId: { in: ongIds } } },
          select: { post: { select: { authorId: true } } },
        })
      : Promise.resolve([]),
    ongIds.length
      ? prisma.conversationParticipant.groupBy({
          by: ["userId"],
          _count: { _all: true },
          where: { userId: { in: ongIds } },
        })
      : Promise.resolve([]),
  ]);
  const reportMap = new Map<string, number>();
  for (const row of reportRows) {
    const aid = row.post?.authorId;
    if (aid) reportMap.set(aid, (reportMap.get(aid) ?? 0) + 1);
  }
  const convMap = new Map(conversations.map((c) => [c.userId, c._count._all]));

  return {
    metrics: statusCounts.map((s) => ({ key: s.accountStatus, label: s.accountStatus, value: s._count._all })),
    items: ongs.map((o) => ({
      userId: o.id,
      name: o.ongProfile?.ongName ?? o.name,
      email: o.email,
      accountStatus: o.accountStatus,
      cnpjMasked: maskCnpj(o.ongProfile?.cnpj ?? null),
      city: o.ongProfile?.city ?? null,
      state: o.ongProfile?.state ?? null,
      postsCount: o._count.socialPostsAuthored,
      chatsCount: convMap.get(o.id) ?? 0,
      reportsCount: reportMap.get(o.id) ?? 0,
      createdAt: o.createdAt.toISOString(),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
  };
}
