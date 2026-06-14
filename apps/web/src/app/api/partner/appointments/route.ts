import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";

export async function GET() {
  const { user, error } = await requireActivePartner();
  if (error) return error;

  const appointments = await prisma.appointment.findMany({
    where: { partnerId: user!.id },
    include: {
      pet: { select: { id: true, name: true, species: true } },
      user: { select: { id: true, name: true, email: true, phone: true } },
      service: { select: { id: true, name: true, price: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });

  return apiSuccess({ appointments, total: appointments.length });
}
