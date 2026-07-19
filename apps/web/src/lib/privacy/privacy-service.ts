import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { maskCpf, maskCnpj, redactSecrets } from "@/lib/security/sanitize";

export type PrivacyRequestType = "EXPORT" | "DELETE_ACCOUNT" | "RECTIFY" | "REVOKE_CONSENT";

export async function createPrivacyRequest(params: {
  userId: string;
  type: PrivacyRequestType;
  description?: string;
}) {
  const existing = await prisma.dataPrivacyRequest.findFirst({
    where: {
      userId: params.userId,
      type: params.type,
      status: { in: ["OPEN", "IN_REVIEW"] },
    },
  });
  if (existing) {
    throw new Error("DUPLICATE_OPEN");
  }

  const request = await prisma.dataPrivacyRequest.create({
    data: {
      userId: params.userId,
      type: params.type,
      description: params.description,
    },
  });

  await writeAuditLog({
    actorId: params.userId,
    action: "CREATE",
    module: "privacy",
    resource: "DataPrivacyRequest",
    resourceId: request.id,
    observation: `Solicitação LGPD: ${params.type}`,
  });

  return request;
}

export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      cnpj: true,
      phone: true,
      city: true,
      state: true,
      role: true,
      accountStatus: true,
      createdAt: true,
      pets: { select: { id: true, name: true, species: true, createdAt: true } },
      orders: { select: { id: true, orderNumber: true, status: true, total: true, createdAt: true } },
      socialPostsAuthored: {
        select: { id: true, content: true, createdAt: true },
        take: 100,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) throw new Error("NOT_FOUND");

  return redactSecrets({
    exportedAt: new Date().toISOString(),
    profile: {
      ...user,
      cpf: maskCpf(user.cpf),
      cnpj: maskCnpj(user.cnpj),
    },
    note: "Exportação parcial — dados completos mediante solicitação formal processada pelo DPO.",
  });
}

export async function listPrivacyRequestsForAdmin(params: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = Math.min(50, params.limit ?? 20);
  const where = params.status ? { status: params.status as "OPEN" | "IN_REVIEW" | "COMPLETED" | "REJECTED" } : {};

  const [total, items] = await Promise.all([
    prisma.dataPrivacyRequest.count({ where }),
    prisma.dataPrivacyRequest.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        processedBy: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    items: items.map((r: (typeof items)[number]) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      description: r.description,
      requestedAt: r.requestedAt.toISOString(),
      processedAt: r.processedAt?.toISOString() ?? null,
      resolution: r.resolution,
      user: r.user,
      processedBy: r.processedBy,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
}

export async function updatePrivacyRequestStatus(params: {
  requestId: string;
  adminId: string;
  status: "IN_REVIEW" | "COMPLETED" | "REJECTED";
  resolution?: string;
}) {
  const request = await prisma.dataPrivacyRequest.findUnique({ where: { id: params.requestId } });
  if (!request) throw new Error("NOT_FOUND");

  const updated = await prisma.dataPrivacyRequest.update({
    where: { id: params.requestId },
    data: {
      status: params.status,
      resolution: params.resolution,
      processedById: params.adminId,
      processedAt: new Date(),
    },
  });

  if (params.status === "COMPLETED" && request.type === "DELETE_ACCOUNT") {
    try {
      const { deactivateAllDevicesForUser } = await import("@/lib/firebase/token-management");
      await deactivateAllDevicesForUser(request.userId);
    } catch {
      /* best-effort — não bloquear fluxo LGPD */
    }
  }

  await writeAuditLog({
    actorId: params.adminId,
    action: "UPDATE",
    module: "privacy",
    resource: "DataPrivacyRequest",
    resourceId: params.requestId,
    observation: `Status LGPD: ${params.status}`,
  });

  return updated;
}
