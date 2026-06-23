import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { createInternalNotification } from "@/lib/notifications/internal";
import { emailAppointmentEvent } from "@/lib/mail/event-dispatch";
import { getUserEmailLocale } from "@/lib/email/templates";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
  reason: z.string().optional(),
});

type RouteContext = { params: Promise<{ appointmentId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const { appointmentId } = await context.params;

  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, partnerId: user!.id },
  });
  if (!appointment) return apiFailure("NOT_FOUND", "Agendamento não encontrado.", 404);

  const now = new Date();
  if (parsed.data.status === "COMPLETED" && appointment.scheduledAt > now) {
    return apiFailure("VALIDATION", "Não é possível concluir agendamento futuro.", 400);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: parsed.data.status,
      ...(parsed.data.status === "CANCELLED"
        ? { cancelledAt: now, cancelReason: parsed.data.reason ?? "Cancelado pelo parceiro" }
        : {}),
      ...(parsed.data.status === "COMPLETED" ? { completedAt: now } : {}),
    },
  });

  const typeMap: Record<string, string> = {
    CONFIRMED: "APPOINTMENT_CONFIRMED",
    CANCELLED: "APPOINTMENT_CANCELLED_BY_PARTNER",
    COMPLETED: "APPOINTMENT_COMPLETED",
    NO_SHOW: "APPOINTMENT_NO_SHOW",
  };

  await createInternalNotification({
    userId: appointment.userId,
    title: "Atualização de agendamento",
    body: `Status do agendamento: ${parsed.data.status}`,
    type: typeMap[parsed.data.status] ?? "APPOINTMENT_UPDATED",
    actionUrl: `/dashboard/client/appointments`,
    data: { appointmentId },
  });

  const client = await prisma.user.findUnique({
    where: { id: appointment.userId },
    select: { email: true, name: true, preferences: true },
  });
  if (client?.email) {
    const eventMap: Partial<Record<string, "APPOINTMENT_CONFIRMED" | "APPOINTMENT_CANCELLED" | "APPOINTMENT_COMPLETED">> = {
      CONFIRMED: "APPOINTMENT_CONFIRMED",
      CANCELLED: "APPOINTMENT_CANCELLED",
      COMPLETED: "APPOINTMENT_COMPLETED",
    };
    const mailEvent = eventMap[parsed.data.status];
    if (mailEvent) {
      void emailAppointmentEvent(mailEvent, client.email, {
        name: client.name,
        serviceName: "Agendamento",
        locale: getUserEmailLocale(client.preferences),
        title: `Agendamento ${parsed.data.status} — EcoPet`,
        message: `Olá ${client.name}, seu agendamento foi atualizado para: ${parsed.data.status}.`,
      });
    }
  }

  return apiSuccess({ appointment: updated });
}
