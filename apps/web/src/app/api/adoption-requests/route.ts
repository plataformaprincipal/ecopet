import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { createNotification } from "@/lib/notifications/notification-service";

const ACTIVE_STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED"] as const;

/** Cliente/visitante autenticado solicita a adoção de um animal disponível. */
export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: { listingId?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return apiFailure("INVALID_BODY", "Corpo inválido.", 400);
  }

  const listingId = body.listingId?.trim();
  if (!listingId) {
    return apiFailure("VALIDATION_ERROR", "Animal não informado.", 400);
  }

  const listing = await prisma.adoptionListing.findUnique({
    where: { id: listingId },
    select: { id: true, name: true, ongId: true, status: true },
  });
  if (!listing) {
    return apiFailure("NOT_FOUND", "Animal não encontrado.", 404);
  }
  if (listing.ongId === user!.id) {
    return apiFailure("FORBIDDEN", "Você não pode solicitar adoção do próprio animal.", 403);
  }
  if (listing.status === "ADOPTED") {
    return apiFailure("UNAVAILABLE", "Este animal já foi adotado.", 409);
  }

  const duplicate = await prisma.adoptionRequest.findFirst({
    where: {
      listingId,
      requesterId: user!.id,
      status: { in: [...ACTIVE_STATUSES] },
    },
    select: { id: true },
  });
  if (duplicate) {
    return apiFailure("DUPLICATE", "Você já tem uma solicitação ativa para este animal.", 409);
  }

  const created = await prisma.adoptionRequest.create({
    data: {
      listingId,
      ongId: listing.ongId,
      requesterId: user!.id,
      message: body.message?.trim() || null,
      status: "PENDING",
      history: [{ status: "PENDING", at: new Date().toISOString(), note: null }] as object,
    },
  });

  await createNotification({
    userId: listing.ongId,
    type: "ADOPTION",
    title: "Nova solicitação de adoção",
    message: `${user!.name} demonstrou interesse em adotar ${listing.name}.`,
    actionUrl: "/ngo/adoptions",
    metadata: { adoptionRequestId: created.id, listingId },
  });

  return apiSuccess({ request: { id: created.id, status: created.status } }, 201);
}
