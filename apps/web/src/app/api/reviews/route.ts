import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { serviceReviewSchema } from "@/schemas/review";
import { sendTransactionalEmail } from "@/lib/mail/transactional";
import { createNotification } from "@/lib/notifications/notification-service";
import { z } from "zod";

const productReviewSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId");
  const partnerId = url.searchParams.get("partnerId");
  const productId = url.searchParams.get("productId");

  if (productId) {
    const reviews = await prisma.review.findMany({
      where: { productId, moderationStatus: "VISIBLE" },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return apiSuccess({ reviews, total: reviews.length });
  }

  if (!serviceId && !partnerId) {
    return apiFailure("VALIDATION", "Informe productId, serviceId ou partnerId.", 400);
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

  const body = await request.json();

  if (body.productId) {
    const parsed = productReviewSchema.safeParse(body);
    if (!parsed.success) {
      return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
    }

    const { productId, orderId, rating, comment } = parsed.data;

    const orderItem = await prisma.orderItem.findFirst({
      where: {
        orderId,
        productId,
        order: { userId: user!.id, status: { in: ["DELIVERED", "COMPLETED", "PICKED_UP"] } },
      },
      include: { order: { include: { items: true } } },
    });
    if (!orderItem) {
      return apiFailure("VALIDATION", "Só é possível avaliar produtos de pedidos entregues.", 400);
    }

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId, userId: user!.id } },
    });
    if (existing) return apiFailure("CONFLICT", "Você já avaliou este produto.", 409);

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { sellerId: true, name: true } });
    if (!product) return apiFailure("NOT_FOUND", "Produto não encontrado.", 404);
    if (product.sellerId === user!.id) {
      return apiFailure("FORBIDDEN", "Não é possível avaliar seu próprio produto.", 403);
    }

  const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: { productId, userId: user!.id, rating, comment: comment ?? null },
        include: { user: { select: { id: true, name: true } } },
      });

      const [avgResult, reviewCount] = await Promise.all([
        tx.review.aggregate({ where: { productId, moderationStatus: "VISIBLE" }, _avg: { rating: true } }),
        tx.review.count({ where: { productId, moderationStatus: "VISIBLE" } }),
      ]);

      await tx.product.update({
        where: { id: productId },
        data: { rating: avgResult._avg.rating ?? rating, reviewCount },
      });

      return created;
    });

    const buyer = await prisma.user.findUnique({ where: { id: user!.id }, select: { name: true } });

    await createNotification({
      userId: product.sellerId,
      type: "REVIEW",
      title: "Nova avaliação de produto",
      message: `${buyer?.name ?? "Cliente"} avaliou ${product.name} com ${rating} estrelas.`,
      actionUrl: `/marketplace/produto/${productId}`,
    });

    return apiSuccess({ review }, 201);
  }

  const parsed = serviceReviewSchema.safeParse(body);
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

  await createNotification({
    userId: partnerId,
    type: "REVIEW",
    title: "Nova avaliação de serviço",
    message: `Um cliente avaliou um serviço com ${rating} estrelas.`,
    actionUrl: `/marketplace/servico/${serviceId}`,
  });

  return apiSuccess({ review }, 201);
}
