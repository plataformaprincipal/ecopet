import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { createInternalNotification } from "@/lib/notifications/internal";
import { emailAppointmentEvent } from "@/lib/mail/event-dispatch";
import { getUserEmailLocale } from "@/lib/email/templates";

type RouteContext = { params: Promise<{ appointmentId: string }> };

export async function PATCH(_req: Request, context: RouteContext) {
  const { user, error } = await requireClient();
  if (error) return error;
  const { appointmentId } = await context.params;

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: user!.id },
  });
  if (!appointment) return apiFailure("NOT_FOUND", "Agendamento não encontrado.", 404);

  if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appointment.status)) {
    return apiFailure("VALIDATION", "Agendamento não pode ser cancelado.", 400);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "Cancelado pelo cliente" },
  });

  if (appointment.partnerId) {
    await createInternalNotification({
      userId: appointment.partnerId,
      title: "Agendamento cancelado",
      body: "O cliente cancelou um agendamento.",
      type: "APPOINTMENT_CANCELLED_BY_CLIENT",
      data: { appointmentId },
    });
    const partner = await prisma.user.findUnique({
      where: { id: appointment.partnerId },
      select: { email: true, name: true, preferences: true },
    });
    if (partner?.email) {
      void emailAppointmentEvent("APPOINTMENT_CANCELLED", partner.email, {
        name: partner.name,
        serviceName: "Agendamento",
        locale: getUserEmailLocale(partner.preferences),
        title: "Agendamento cancelado — EcoPet",
        message: "Um cliente cancelou um agendamento.",
      });
    }
  }

  const client = await prisma.user.findUnique({
    where: { id: user!.id },
    select: { email: true, name: true, preferences: true },
  });
  if (client?.email) {
    void emailAppointmentEvent("APPOINTMENT_CANCELLED", client.email, {
      name: client.name,
      serviceName: "Agendamento",
      locale: getUserEmailLocale(client.preferences),
      title: "Agendamento cancelado — EcoPet",
      message: "Seu agendamento foi cancelado com sucesso.",
    });
  }

  return apiSuccess({ appointment: updated });
}
