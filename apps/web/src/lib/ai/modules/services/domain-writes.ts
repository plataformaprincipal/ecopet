/**
 * Adaptadores de escrita para a IA — mutações com ownership e confirmação.
 */
import "server-only";

import { z } from "zod";
import {
  AccountStatus,
  AppointmentAttendanceMode,
  PartnerServiceStatus,
  SupportCategory,
  TicketPriority,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addToCart, getOrCreateCart } from "@/lib/cart/cart-service";
import { createSupportTicket } from "@/lib/messages/support";
import {
  defaultAttendanceMode,
  hasAppointmentConflict,
  isWithinAvailability,
  resolveServiceType,
} from "@/lib/appointments/booking";
import { startOfLocalDay, startOfTomorrowLocal } from "@/lib/appointments/datetime";
import { createInternalNotification } from "@/lib/notifications/internal";
import { validateClientAction } from "@/lib/ai/client-actions";

const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20).optional().default(1),
});

const supportTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(5).max(4000),
  category: z.nativeEnum(SupportCategory).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
});

const prepareAppointmentSchema = z.object({
  petId: z.string().min(1),
  serviceId: z.string().min(1),
  startAt: z.string().min(1),
  notes: z.string().max(1000).optional().nullable(),
  attendanceMode: z.nativeEnum(AppointmentAttendanceMode).optional(),
  pickupAddress: z.string().optional().nullable(),
  pickupComplement: z.string().optional().nullable(),
  pickupReference: z.string().optional().nullable(),
  pickupPhone: z.string().optional().nullable(),
});

export async function writeAddToCart(opts: {
  userId: string;
  params: Record<string, unknown>;
  confirmed?: boolean;
}) {
  const parsed = addToCartSchema.safeParse(opts.params);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Parâmetros inválidos para carrinho.");
  }
  const { productId, quantity } = parsed.data;

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      deletedAt: null,
      status: "ACTIVE",
      approvalStatus: "APPROVED",
    },
    select: { id: true, stock: true, name: true, price: true },
  });
  if (!product) throw new Error("Produto não encontrado ou indisponível.");
  if (product.stock < quantity) throw new Error("Estoque insuficiente.");

  const preview = {
    productId: product.id,
    name: product.name,
    quantity,
    unitPrice: product.price,
    stock: product.stock,
  };

  if (!opts.confirmed) {
    return { preview, executed: false as const };
  }

  const cart = await getOrCreateCart(opts.userId);
  await addToCart(cart, product.id, quantity);

  return {
    executed: true as const,
    message: `Item adicionado ao carrinho: ${product.name}`,
    productId: product.id,
    quantity,
  };
}

export async function writeSupportTicket(opts: {
  userId: string;
  params: Record<string, unknown>;
  confirmed?: boolean;
}) {
  const parsed = supportTicketSchema.safeParse(opts.params);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Parâmetros inválidos para ticket.");
  }
  const data = parsed.data;

  const preview = {
    subject: data.subject,
    description: data.description.slice(0, 240),
    category: data.category ?? "OTHER",
    priority: data.priority ?? "NORMAL",
  };

  if (!opts.confirmed) {
    return { preview, executed: false as const };
  }

  const ticket = await createSupportTicket({
    userId: opts.userId,
    subject: data.subject,
    description: data.description,
    category: data.category,
    priority: data.priority,
  });

  return {
    executed: true as const,
    ticketId: ticket.id,
    number: ticket.number,
    subject: ticket.subject,
    status: ticket.status,
  };
}

/**
 * Rascunho de agendamento. Sem confirmed=true não persiste.
 * Com confirmed=true segue ownership/validações do POST /api/client/appointments.
 */
export async function writePrepareAppointment(opts: {
  userId: string;
  params: Record<string, unknown>;
  confirmed?: boolean;
}) {
  const parsed = prepareAppointmentSchema.safeParse(opts.params);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Parâmetros inválidos para agendamento.");
  }

  const {
    petId,
    serviceId,
    startAt,
    notes,
    attendanceMode,
    pickupAddress,
    pickupComplement,
    pickupReference,
    pickupPhone,
  } = parsed.data;

  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) throw new Error("Data/hora inválida.");
  if (start <= new Date()) throw new Error("Não é possível agendar no passado.");
  const startDay = startOfLocalDay(start);
  if (startDay < startOfTomorrowLocal()) {
    throw new Error("Agendamentos disponíveis a partir de amanhã.");
  }

  const pet = await prisma.pet.findFirst({
    where: { id: petId, ownerId: opts.userId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!pet) throw new Error("Pet inválido ou sem permissão.");

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      deletedAt: null,
      status: PartnerServiceStatus.ACTIVE,
      approvalStatus: "APPROVED",
      provider: { accountStatus: AccountStatus.ACTIVE, role: "PARTNER" },
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          partnerProfile: { select: { businessName: true } },
        },
      },
    },
  });
  if (!service) throw new Error("Serviço indisponível.");

  const duration = service.durationMin ?? 60;
  const end = new Date(start.getTime() + duration * 60_000);
  const mode = attendanceMode ?? defaultAttendanceMode();

  const draft = {
    petId: pet.id,
    petName: pet.name,
    serviceId: service.id,
    serviceName: service.name,
    partnerId: service.providerId,
    partnerName: service.provider.partnerProfile?.businessName ?? service.provider.name,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    durationMin: duration,
    attendanceMode: mode,
    notes: notes?.trim() || null,
    price: service.price,
  };

  if (!opts.confirmed) {
    return {
      executed: false as const,
      draft: true as const,
      preview: draft,
      message: "Rascunho de agendamento pronto. Confirme para criar.",
    };
  }

  const slots = await prisma.partnerAvailability.findMany({
    where: { partnerId: service.providerId, isActive: true },
  });
  if (!slots.length) throw new Error("Parceiro sem disponibilidade configurada.");

  if (!isWithinAvailability(start.getDay(), start, end, slots)) {
    throw new Error("Horário fora da disponibilidade do parceiro.");
  }

  const blocked = await prisma.partnerBlockedSlot.findFirst({
    where: {
      partnerId: service.providerId,
      startAt: { lt: end },
      endAt: { gt: start },
    },
  });
  if (blocked) throw new Error("Horário bloqueado pelo parceiro.");

  if (await hasAppointmentConflict(service.providerId, start, end, undefined, service.id)) {
    throw new Error("Horário indisponível para este serviço.");
  }

  if (mode === "TELEBUSCA") {
    if (!pickupAddress?.trim() || !pickupPhone?.trim()) {
      throw new Error("Para tele-busca, informe endereço e telefone de contato.");
    }
  }

  const observationParts: string[] = [];
  if (notes?.trim()) observationParts.push(notes.trim());
  if (mode === "TELEBUSCA") {
    observationParts.push(
      [
        "Tele-busca:",
        `Endereço: ${pickupAddress}`,
        pickupComplement ? `Complemento: ${pickupComplement}` : null,
        pickupReference ? `Referência: ${pickupReference}` : null,
        `Telefone: ${pickupPhone}`,
      ]
        .filter(Boolean)
        .join(" | ")
    );
  } else if (mode === "TUTOR_DELIVERY") {
    const partnerAddr = await prisma.partnerProfile.findUnique({
      where: { userId: service.providerId },
      select: { address: true, city: true, state: true, businessHours: true, businessName: true },
    });
    if (partnerAddr) {
      observationParts.push(
        `Entrega no local: ${partnerAddr.businessName} — ${partnerAddr.address}, ${partnerAddr.city}/${partnerAddr.state}${
          partnerAddr.businessHours ? ` | Horário: ${partnerAddr.businessHours}` : ""
        }`
      );
    }
  }

  const appointment = await prisma.appointment.create({
    data: {
      userId: opts.userId,
      petId,
      partnerId: service.providerId,
      serviceId: service.id,
      serviceType: resolveServiceType(service.name, service.category),
      attendanceMode: mode,
      scheduledDate: start,
      scheduledTime: start.toISOString().slice(11, 16),
      scheduledAt: start,
      endAt: end,
      observations: observationParts.length ? observationParts.join("\n") : null,
      status: "PENDING",
    },
  });

  await Promise.all([
    createInternalNotification({
      userId: opts.userId,
      title: "Agendamento solicitado",
      body: `Seu agendamento para ${service.name} foi registrado.`,
      type: "APPOINTMENT_CREATED",
      actionUrl: `/dashboard/client/appointments`,
      data: { appointmentId: appointment.id },
    }),
    createInternalNotification({
      userId: service.providerId,
      title: "Novo agendamento",
      body: `Você recebeu um novo agendamento para ${service.name}.`,
      type: "APPOINTMENT_RECEIVED",
      actionUrl: `/dashboard/partner/appointments`,
      data: { appointmentId: appointment.id },
    }),
  ]);

  return {
    executed: true as const,
    draft: false as const,
    appointmentId: appointment.id,
    status: appointment.status,
    scheduledAt: appointment.scheduledAt.toISOString(),
    preview: draft,
  };
}

/** Retorna payload CLIENT_ACTION para o frontend — nunca executa JS. */
export function writeClientAction(params: Record<string, unknown>) {
  const validated = validateClientAction(params.action, params.payload ?? {});
  if (!validated.ok) {
    throw new Error(validated.error);
  }
  return validated.value;
}
