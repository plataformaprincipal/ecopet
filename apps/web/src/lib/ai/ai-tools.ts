import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { requiresExplicitConfirmation } from "@/lib/ai/ai-policy";
import { writeAiAuditLog } from "@/lib/ai/ai-audit";
import { AiRuntimeError, AI_RUNTIME_ERROR_CODES } from "@/lib/ai/ai-errors";

export type AiToolContext = {
  userId: string;
  role: UserRole;
  confirmed?: boolean;
};

type ToolHandler = (ctx: AiToolContext, params: Record<string, unknown>) => Promise<unknown>;

const handlers = new Map<string, ToolHandler>();

function register(name: string, handler: ToolHandler) {
  handlers.set(name, handler);
}

register("getCurrentUserProfile", async (ctx) => {
  return prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { id: true, name: true, username: true, role: true, createdAt: true },
  });
});

register("listUserPets", async (ctx) => {
  return prisma.pet.findMany({
    where: { ownerId: ctx.userId },
    select: { id: true, name: true, species: true, breed: true, photo: true },
    take: 20,
  });
});

register("getPetProfile", async (ctx, params) => {
  const petId = String(params.petId ?? "");
  return prisma.pet.findFirst({
    where: { id: petId, ownerId: ctx.userId },
    select: {
      id: true,
      name: true,
      species: true,
      breed: true,
      sex: true,
      weight: true,
      birthDate: true,
      notes: true,
    },
  });
});

register("searchProducts", async (_ctx, params) => {
  const query = String(params.query ?? "").trim();
  return prisma.product.findMany({
    where: {
      deletedAt: null,
      approvalStatus: "APPROVED",
      status: "ACTIVE",
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      rating: true,
      isSponsored: true,
      shortDescription: true,
    },
    take: 10,
  });
});

register("searchServices", async (_ctx, params) => {
  const query = String(params.query ?? "").trim();
  return prisma.service.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      approvalStatus: "APPROVED",
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { id: true, name: true, price: true, durationMin: true, city: true, shortDescription: true },
    take: 10,
  });
});

register("getServiceAvailability", async (_ctx, params) => {
  const serviceId = String(params.serviceId ?? "");
  const service = await prisma.service.findFirst({
    where: { id: serviceId, deletedAt: null, isActive: true },
    select: { id: true, name: true, durationMin: true, providerId: true },
  });
  if (!service) return { available: false, slots: [] };
  // Disponibilidade real virá de slots/agenda — aqui retornamos metadados do serviço
  return { available: true, service, source: "database", note: "Slots devem ser consultados no módulo de agenda." };
});

register("getCart", async (ctx) => {
  const cart = await prisma.cart.findFirst({
    where: { userId: ctx.userId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, price: true, stock: true } },
        },
      },
    },
  });
  return cart;
});

register("getOrder", async (ctx, params) => {
  const orderId = String(params.orderId ?? "");
  return prisma.order.findFirst({
    where: { id: orderId, userId: ctx.userId },
    include: { items: true },
  });
});

register("getOrderStatus", async (ctx, params) => {
  const orderId = String(params.orderId ?? "");
  return prisma.order.findFirst({
    where: { id: orderId, userId: ctx.userId },
    select: { id: true, status: true, total: true, updatedAt: true },
  });
});

register("getAppointments", async (ctx) => {
  return prisma.appointment.findMany({
    where: { userId: ctx.userId },
    orderBy: { scheduledAt: "asc" },
    take: 10,
    select: { id: true, status: true, scheduledAt: true, serviceType: true, petId: true },
  });
});

register("getAppointmentDetails", async (ctx, params) => {
  const id = String(params.appointmentId ?? "");
  return prisma.appointment.findFirst({
    where: { id, OR: [{ userId: ctx.userId }, { partnerId: ctx.userId }] },
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      serviceType: true,
      observations: true,
      petId: true,
    },
  });
});

register("createAppointmentDraft", async (ctx, params) => {
  return {
    draft: true,
    requiresConfirmation: true,
    payload: {
      petId: params.petId,
      serviceId: params.serviceId,
      scheduledAt: params.scheduledAt,
      userId: ctx.userId,
    },
  };
});

register("confirmAppointment", async (ctx, params) => {
  if (!ctx.confirmed) {
    throw new AiRuntimeError(
      AI_RUNTIME_ERROR_CODES.CONFIRMATION_REQUIRED,
      "Confirmação explícita necessária.",
      409
    );
  }
  await writeAiAuditLog({
    userId: ctx.userId,
    role: ctx.role,
    module: "appointments",
    action: "confirmAppointment",
    decision: "CONFIRM_REQUIRED",
    metadata: { note: "Persistência deve ocorrer via API de agendamentos após confirmação UI." },
  });
  return { ok: false, message: "Use a API de agendamentos com confirmação do usuário." };
});

register("createCheckoutDraft", async (ctx) => {
  const cart = await prisma.cart.findFirst({
    where: { userId: ctx.userId },
    include: { items: true },
  });
  return { draft: true, requiresConfirmation: true, cart };
});

register("confirmCheckout", async (ctx) => {
  if (!ctx.confirmed) {
    throw new AiRuntimeError(AI_RUNTIME_ERROR_CODES.CONFIRMATION_REQUIRED, "Confirmação necessária.", 409);
  }
  return { ok: false, message: "Checkout deve ser confirmado na API de pedidos." };
});

register("requestCancellation", async (ctx, params) => {
  if (!ctx.confirmed) {
    throw new AiRuntimeError(AI_RUNTIME_ERROR_CODES.CONFIRMATION_REQUIRED, "Confirmação necessária.", 409);
  }
  return { ok: false, draft: true, orderId: params.orderId, message: "Cancelamento exige fluxo oficial." };
});

register("getPartnerDashboardSummary", async (ctx) => {
  if (ctx.role !== "PARTNER" && ctx.role !== "ADMIN") {
    throw new AiRuntimeError(AI_RUNTIME_ERROR_CODES.PERSONA_INVALID, "Acesso negado.", 403);
  }
  const [products, services, lowStock] = await Promise.all([
    prisma.product.count({ where: { sellerId: ctx.userId, deletedAt: null } }),
    prisma.service.count({ where: { providerId: ctx.userId, deletedAt: null } }),
    prisma.product.count({ where: { sellerId: ctx.userId, deletedAt: null, stock: { lte: 5 } } }),
  ]);
  const upcoming = await prisma.appointment.count({
    where: { partnerId: ctx.userId, scheduledAt: { gte: new Date() }, status: { in: ["PENDING", "CONFIRMED"] } },
  });
  return { products, services, lowStock, upcomingAppointments: upcoming };
});

register("getOngCampaigns", async (ctx) => {
  if (ctx.role !== "ONG" && ctx.role !== "ADMIN") {
    throw new AiRuntimeError(AI_RUNTIME_ERROR_CODES.PERSONA_INVALID, "Acesso negado.", 403);
  }
  return { campaigns: [], note: "Campanhas carregadas do módulo ONG quando disponíveis." };
});

register("createNotificationDraft", async (ctx, params) => {
  return {
    draft: true,
    requiresConfirmation: true,
    title: params.title,
    body: params.body,
    userId: ctx.userId,
  };
});

/**
 * Executa ferramenta interna com validação de sessão.
 * userId sempre vem do contexto autenticado — nunca do modelo.
 */
export async function executeInternalTool(
  toolName: string,
  ctx: AiToolContext,
  params: Record<string, unknown> = {}
) {
  const handler = handlers.get(toolName);
  if (!handler) {
    return { toolId: toolName, executed: false, result: null, error: "TOOL_NOT_FOUND" };
  }
  if (requiresExplicitConfirmation(toolName) && !ctx.confirmed) {
    await writeAiAuditLog({
      userId: ctx.userId,
      role: ctx.role,
      module: "automation",
      action: toolName,
      decision: "CONFIRM_REQUIRED",
    });
    return {
      toolId: toolName,
      executed: false,
      requiresConfirmation: true,
      result: { status: "pending_confirmation" },
    };
  }
  try {
    const result = await handler(ctx, params);
    await writeAiAuditLog({
      userId: ctx.userId,
      role: ctx.role,
      module: "automation",
      action: toolName,
      decision: ctx.confirmed ? "EXECUTED" : "ALLOW",
      metadata: { keys: Object.keys(params) },
    });
    return { toolId: toolName, executed: true, result };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Falha na ferramenta.";
    return { toolId: toolName, executed: false, error: message, result: null };
  }
}

export function listInternalToolNames(): string[] {
  return [...handlers.keys()];
}

// Reexport registry legado
export { listTools, listToolsForAgent, executeTool, registerTool, getTool } from "@/lib/ai/tools/registry";
