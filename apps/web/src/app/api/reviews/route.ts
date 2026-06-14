import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { serviceReviewSchema } from "@/schemas/review";
import { sendTransactionalEmail } from "@/lib/mail/transactional";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId");
  const partnerId = url.searchParams.get("partnerId");

  if (!serviceId && !partnerId) {
    return apiFailure("VALIDATION", "Informe serviceId ou partnerId.", 400);
  }

  const reviews = await prisma.serviceReview.findMany({
    where: {
      moderationStatus: "VISIBLE",
      ...(serviceId ? { serviceId } : {}),
      ...(partnerId ? { partnerId } : {}),
    },
    include: {
      user: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return apiSuccess({ reviews, total: reviews.length });
}

export async function POST(request: Request) {
  const { user, error } = await requireClient();
  if (error) return error;

  const parsed = serviceReviewSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  }

  const { appointmentId, rating, comment } = parsed.data;

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: user!.id },
    include: { serviceReview: true },
  });
  if (!appointment) return apiFailure("NOT_FOUND", "Agendamento não encontrado.", 404);
  if (appointment.status !== "COMPLETED") {
    return apiFailure("VALIDATION", "Só é possível avaliar agendamentos concluídos.", 400);
  }
  if (appointment.serviceReview) {
    return apiFailure("CONFLICT", "Este agendamento já foi avaliado.", 409);
  }
  if (!appointment.serviceId || !appointment.partnerId) {
    return apiFailure("VALIDATION", "Agendamento sem serviço vinculado.", 400);
  }

  const serviceId = appointment.serviceId;
  const partnerId = appointment.partnerId;

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.serviceReview.create({
      data: {
        appointmentId,
        userId: user!.id,
        serviceId,
        partnerId,
        rating,
        comment: comment ?? null,
      },
      include: {
        user: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });

    const [avgResult, reviewCount] = await Promise.all([
      tx.serviceReview.aggregate({
        where: { serviceId, moderationStatus: "VISIBLE" },
        _avg: { rating: true },
      }),
      tx.serviceReview.count({ where: { serviceId, moderationStatus: "VISIBLE" } }),
    ]);

    await tx.service.update({
      where: { id: serviceId },
      data: {
        rating: avgResult._avg.rating ?? rating,
        reviewCount,
      },
    });

    return created;
  });

  const partner = await prisma.user.findUnique({ where: { id: partnerId }, select: { email: true, name: true } });
  if (partner?.email) {
    await sendTransactionalEmail({
      event: "REVIEW_RECEIVED",
      to: partner.email,
      subject: "Nova avaliação recebida — EcoPet",
      text: `Você recebeu uma avaliação ${rating}/5.`,
      html: `<p>Você recebeu uma avaliação <strong>${rating}/5</strong>.</p>`,
    });
  }

  return apiSuccess({ review }, 201);
}
