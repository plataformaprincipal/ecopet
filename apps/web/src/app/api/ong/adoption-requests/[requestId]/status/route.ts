import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireOngWithAccess } from "@/lib/ong/require-ong-access";
import { createNotification } from "@/lib/notifications/notification-service";
import { auditNgoErp } from "@/lib/ong/erp/store";

type RouteContext = { params: Promise<{ requestId: string }> };

const VALID_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
] as const;
type RequestStatus = (typeof VALID_STATUSES)[number];

const STATUS_MESSAGE: Record<RequestStatus, string> = {
  PENDING: "Sua solicitação de adoção foi registrada.",
  UNDER_REVIEW: "Sua solicitação de adoção está em análise.",
  APPROVED: "Sua solicitação de adoção foi aprovada! A ONG entrará em contato.",
  REJECTED: "Sua solicitação de adoção não foi aprovada desta vez.",
  COMPLETED: "Parabéns! A adoção foi concluída.",
  CANCELLED: "O processo de adoção foi cancelado.",
};

export async function PATCH(request: Request, context: RouteContext) {
  const { user, error } = await requireOngWithAccess(true);
  if (error) return error;

  const { requestId } = await context.params;

  let body: { status?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return apiFailure("INVALID_BODY", "Corpo inválido.", 400);
  }

  const status = body.status as RequestStatus | undefined;
  if (!status || !VALID_STATUSES.includes(status)) {
    return apiFailure("VALIDATION_ERROR", "Status inválido.", 400);
  }

  const existing = await prisma.adoptionRequest.findFirst({
    where: { id: requestId, ongId: user!.id },
    include: { listing: { select: { id: true, name: true } } },
  });
  if (!existing) {
    return apiFailure("NOT_FOUND", "Solicitação não encontrada.", 404);
  }

  const history = Array.isArray(existing.history) ? existing.history : [];
  const updatedHistory = [
    ...history,
    { status, note: body.note ?? null, at: new Date().toISOString() },
  ];

  const updated = await prisma.adoptionRequest.update({
    where: { id: requestId },
    data: { status, history: updatedHistory as object },
  });

  await auditNgoErp({
    actorId: user!.id,
    ongId: user!.id,
    module: "adocoes",
    resource: "adoption_request",
    action: status === "REJECTED" ? "REJECT" : status === "APPROVED" || status === "COMPLETED" ? "APPROVE" : "UPDATE",
    resourceId: requestId,
    entityBefore: { status: existing.status },
    entityAfter: { status, note: body.note ?? null },
    observation: `Adoção ${existing.listing?.name ?? requestId}: ${status}`,
  });

  // Sincroniza o status do animal quando necessário.
  if (existing.listingId) {
    if (status === "COMPLETED") {
      await prisma.adoptionListing.update({
        where: { id: existing.listingId },
        data: { status: "ADOPTED" },
      });
    } else if (status === "UNDER_REVIEW" || status === "APPROVED") {
      await prisma.adoptionListing.update({
        where: { id: existing.listingId },
        data: { status: "PENDING" },
      });
    }
  }

  // Notifica o interessado.
  await createNotification({
    userId: existing.requesterId,
    type: "ADOPTION",
    title: "Atualização da adoção",
    message: `${existing.listing?.name ?? "Animal"}: ${STATUS_MESSAGE[status]}`,
    actionUrl: "/client/notifications",
    metadata: { adoptionRequestId: requestId, status },
  });

  return apiSuccess({ request: { id: updated.id, status: updated.status } });
}
