import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";

type RouteContext = { params: Promise<{ appointmentId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const { appointmentId } = await context.params;

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, partnerId: user!.id },
    include: {
      pet: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
      service: true,
    },
  });
  if (!appointment) return apiFailure("NOT_FOUND", "Agendamento não encontrado.", 404);
  return apiSuccess({ appointment });
}
