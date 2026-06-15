import { prisma } from "@/lib/prisma";
import type { GestorFilters } from "@/lib/gestor/gestor-filters";
import { dateRangeWhere, paginationArgs } from "@/lib/gestor/gestor-filters";

export async function getGestorMarketplace(filters: GestorFilters) {
  const dateWhere = dateRangeWhere(filters);
  const [
    productsActive,
    productsPending,
    productsHidden,
    productsNoStock,
    servicesActive,
    servicesInactive,
    ordersByStatus,
    topProductPartners,
    topServicePartners,
    categoryUsage,
  ] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.product.count({ where: { deletedAt: null, approvalStatus: "PENDING" } }),
    prisma.product.count({ where: { deletedAt: null, status: { in: ["INACTIVE", "OUT_OF_STOCK"] } } }),
    prisma.product.count({ where: { deletedAt: null, stock: 0, status: "ACTIVE" } }),
    prisma.service.count({ where: { deletedAt: null, isActive: true, status: "ACTIVE" } }),
    prisma.service.count({ where: { deletedAt: null, OR: [{ isActive: false }, { status: { not: "ACTIVE" } }] } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true }, where: dateWhere }),
    prisma.product.groupBy({
      by: ["sellerId"],
      _count: { _all: true },
      where: { deletedAt: null },
      orderBy: { _count: { sellerId: "desc" } },
      take: 10,
    }),
    prisma.service.groupBy({
      by: ["providerId"],
      _count: { _all: true },
      where: { deletedAt: null },
      orderBy: { _count: { providerId: "desc" } },
      take: 10,
    }),
    prisma.product.groupBy({
      by: ["catalogCategory"],
      _count: { _all: true },
      where: { deletedAt: null, catalogCategory: { not: null } },
      orderBy: { _count: { catalogCategory: "desc" } },
      take: 10,
    }),
  ]);

  const partnerIds = [...new Set([...topProductPartners.map((p) => p.sellerId), ...topServicePartners.map((s) => s.providerId)])];
  const partners = partnerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: partnerIds } },
        select: { id: true, name: true, partnerProfile: { select: { businessName: true } } },
      })
    : [];
  const partnerName = new Map(partners.map((p) => [p.id, p.partnerProfile?.businessName ?? p.name]));

  return {
    metrics: [
      { key: "products_active", label: "Produtos ativos", value: productsActive },
      { key: "products_pending", label: "Produtos pendentes", value: productsPending },
      { key: "products_hidden", label: "Produtos ocultos/inativos", value: productsHidden },
      { key: "products_no_stock", label: "Produtos sem estoque", value: productsNoStock },
      { key: "services_active", label: "Serviços ativos", value: servicesActive },
      { key: "services_inactive", label: "Serviços inativos", value: servicesInactive },
    ],
    ordersByStatus: ordersByStatus.map((o) => ({ status: o.status, count: o._count._all })),
    topProductPartners: topProductPartners.map((p) => ({
      partnerId: p.sellerId,
      name: partnerName.get(p.sellerId) ?? p.sellerId,
      count: p._count._all,
    })),
    topServicePartners: topServicePartners.map((s) => ({
      partnerId: s.providerId,
      name: partnerName.get(s.providerId) ?? s.providerId,
      count: s._count._all,
    })),
    topCategories: categoryUsage.map((c) => ({
      category: c.catalogCategory,
      count: c._count._all,
    })),
  };
}

export async function getGestorProducts(filters: GestorFilters) {
  const where = {
    deletedAt: null,
    ...dateRangeWhere(filters),
    ...(filters.status ? { status: filters.status as "ACTIVE" | "DRAFT" | "INACTIVE" | "OUT_OF_STOCK" } : {}),
    ...(filters.q ? { name: { contains: filters.q, mode: "insensitive" as const } } : {}),
  };
  const [total, items, byStatus] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true,
        approvalStatus: true,
        stock: true,
        price: true,
        createdAt: true,
        seller: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
    }),
    prisma.product.groupBy({ by: ["status"], _count: { _all: true }, where: { deletedAt: null } }),
  ]);
  return {
    metrics: byStatus.map((s) => ({ key: s.status, label: s.status, value: s._count._all })),
    items: items.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      sellerName: p.seller.name,
      sellerId: p.seller.id,
      seller: undefined,
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
  };
}

export async function getGestorServices(filters: GestorFilters) {
  const where = {
    deletedAt: null,
    ...dateRangeWhere(filters),
    ...(filters.status ? { status: filters.status as "ACTIVE" | "DRAFT" | "INACTIVE" } : {}),
    ...(filters.q ? { name: { contains: filters.q, mode: "insensitive" as const } } : {}),
  };
  const [total, items, byStatus] = await Promise.all([
    prisma.service.count({ where }),
    prisma.service.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true,
        isActive: true,
        price: true,
        createdAt: true,
        provider: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
    }),
    prisma.service.groupBy({ by: ["status"], _count: { _all: true }, where: { deletedAt: null } }),
  ]);
  return {
    metrics: byStatus.map((s) => ({ key: s.status, label: s.status, value: s._count._all })),
    items: items.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      providerName: s.provider.name,
      providerId: s.provider.id,
      provider: undefined,
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
  };
}

export async function getGestorOrders(filters: GestorFilters) {
  const where = dateRangeWhere(filters);
  const [total, items, byStatus, volume] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        partner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true }, where }),
    prisma.order.aggregate({ where, _sum: { total: true }, _avg: { total: true } }),
  ]);
  return {
    metrics: [
      { key: "orders_total", label: "Pedidos", value: total },
      ...byStatus.map((s) => ({ key: s.status, label: s.status, value: s._count._all })),
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
    ],
    items: items.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      paymentMethod: o.paymentMethod,
      buyerName: o.user.name,
      buyerEmail: o.user.email,
      partnerName: o.partner?.name ?? null,
      createdAt: o.createdAt.toISOString(),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
    disclaimer: "Valores representam pedidos registrados na plataforma, não faturamento confirmado por gateway.",
  };
}

export async function getGestorAppointments(filters: GestorFilters) {
  const where = {
    ...dateRangeWhere(filters),
    ...(filters.status ? { status: filters.status as "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW" } : {}),
  };
  const [total, items, byStatus, topServices, topPartners] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        scheduledTime: true,
        service: { select: { id: true, name: true } },
        partner: { select: { id: true, name: true } },
        user: { select: { name: true } },
      },
      orderBy: { scheduledAt: "desc" },
      ...paginationArgs(filters),
    }),
    prisma.appointment.groupBy({ by: ["status"], _count: { _all: true }, where }),
    prisma.appointment.groupBy({
      by: ["serviceId"],
      _count: { _all: true },
      where: { serviceId: { not: null } },
      orderBy: { _count: { serviceId: "desc" } },
      take: 10,
    }),
    prisma.appointment.groupBy({
      by: ["partnerId"],
      _count: { _all: true },
      where: { partnerId: { not: null } },
      orderBy: { _count: { partnerId: "desc" } },
      take: 10,
    }),
  ]);

  const timeSlots = await prisma.appointment.groupBy({
    by: ["scheduledTime"],
    _count: { _all: true },
    where,
    orderBy: { _count: { scheduledTime: "desc" } },
    take: 10,
  });

  return {
    metrics: byStatus.map((s) => ({ key: s.status, label: s.status, value: s._count._all })),
    topServices: topServices.map((s) => ({ serviceId: s.serviceId, count: s._count._all })),
    topPartners: topPartners.map((p) => ({ partnerId: p.partnerId, count: p._count._all })),
    topTimeSlots: timeSlots.map((t) => ({ time: t.scheduledTime, count: t._count._all })),
    items: items.map((a) => ({
      id: a.id,
      status: a.status,
      scheduledAt: a.scheduledAt.toISOString(),
      scheduledTime: a.scheduledTime,
      serviceName: a.service?.name ?? null,
      partnerName: a.partner?.name ?? null,
      clientName: a.user.name,
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
  };
}
