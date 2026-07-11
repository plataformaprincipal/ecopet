import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import type { AiModule, AiLocale } from "@/lib/ai/ai-config";
import { AI_SAFETY_DISCLAIMER, normalizeLocale } from "@/lib/ai/ai-config";
import { VET_PROHIBITIONS, MARKETPLACE_PROHIBITIONS } from "@/lib/ai/ai-policy";

export type AiContextEntityIds = {
  petId?: string;
  productId?: string;
  serviceId?: string;
  orderId?: string;
  appointmentId?: string;
  partnerId?: string;
  ongId?: string;
  conversationId?: string;
};

/**
 * Monta contexto mínimo autorizado — princípio de minimização de dados.
 * Nunca envia CPF, senha, tokens ou dados de terceiros.
 */
export async function buildMinimalContext(params: {
  userId: string;
  role: UserRole;
  module: AiModule;
  locale?: string;
  entityIds?: AiContextEntityIds;
}): Promise<{ text: string; locale: AiLocale; disclaimer: string }> {
  const locale = normalizeLocale(params.locale);
  const parts: string[] = [];
  parts.push(`Idioma da resposta: ${locale}`);
  parts.push(`Módulo: ${params.module}`);
  parts.push(`Persona: ${params.role}`);
  parts.push(`Aviso obrigatório: ${AI_SAFETY_DISCLAIMER[locale]}`);

  if (params.module === "pets" || params.entityIds?.petId) {
    parts.push(...VET_PROHIBITIONS);
  }
  if (params.module === "marketplace" || params.module === "products") {
    parts.push(...MARKETPLACE_PROHIBITIONS);
  }

  const ids = params.entityIds ?? {};

  if (ids.petId) {
    const pet = await prisma.pet.findFirst({
      where: { id: ids.petId, ownerId: params.userId },
      select: { id: true, name: true, species: true, breed: true, birthDate: true, sex: true, weight: true },
    });
    if (pet) {
      parts.push(
        `Pet autorizado: nome=${pet.name}; espécie=${pet.species}; raça=${pet.breed ?? "n/d"}; sexo=${pet.sex ?? "n/d"}; peso=${pet.weight ?? "n/d"}.`
      );
    }
  }

  if (ids.productId) {
    const product = await prisma.product.findFirst({
      where: { id: ids.productId, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        catalogCategory: true,
        isSponsored: true,
      },
    });
    if (product) {
      parts.push(
        `Produto real: nome=${product.name}; preço=${product.price}; estoque=${product.stock}; categoria=${product.catalogCategory ?? "n/d"}; patrocinado=${product.isSponsored}; descrição=${(product.description ?? "").slice(0, 400)}.`
      );
    }
  }

  if (ids.serviceId) {
    const service = await prisma.service.findFirst({
      where: { id: ids.serviceId, deletedAt: null },
      select: { id: true, name: true, description: true, price: true, durationMin: true },
    });
    if (service) {
      parts.push(
        `Serviço real: nome=${service.name}; preço=${service.price}; duraçãoMin=${service.durationMin ?? "n/d"}; descrição=${(service.description ?? "").slice(0, 400)}.`
      );
    }
  }

  if (ids.orderId) {
    const order = await prisma.order.findFirst({
      where: { id: ids.orderId, userId: params.userId },
      select: { id: true, status: true, total: true, createdAt: true },
    });
    if (order) {
      parts.push(`Pedido do usuário: id=${order.id}; status=${order.status}; total=${order.total}.`);
    }
  }

  if (ids.appointmentId) {
    const appt = await prisma.appointment.findFirst({
      where: {
        id: ids.appointmentId,
        OR: [{ userId: params.userId }, { partnerId: params.userId }],
      },
      select: { id: true, status: true, scheduledAt: true, observations: true },
    });
    if (appt) {
      parts.push(
        `Agendamento autorizado: id=${appt.id}; status=${appt.status}; data=${appt.scheduledAt.toISOString()}.`
      );
    }
  }

  // Perfil mínimo (sem dados sensíveis)
  if (params.module === "profile") {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { name: true, username: true, role: true, createdAt: true },
    });
    if (user) {
      parts.push(`Perfil: nome=${user.name}; username=${user.username ?? "n/d"}; papel=${user.role}.`);
    }
  }

  return {
    text: parts.join("\n"),
    locale,
    disclaimer: AI_SAFETY_DISCLAIMER[locale],
  };
}
