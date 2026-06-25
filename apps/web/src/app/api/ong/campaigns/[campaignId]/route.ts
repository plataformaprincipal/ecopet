import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireOngWithAccess } from "@/lib/ong/require-ong-access";
import {
  serializeCampaign,
  CAMPAIGN_CATEGORIES,
  CAMPAIGN_STATUSES,
  CAMPAIGN_URGENCIES,
} from "@/lib/ong/serialize-campaign";

type RouteContext = { params: Promise<{ campaignId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { user, error } = await requireOngWithAccess();
  if (error) return error;
  const { campaignId } = await context.params;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, ongId: user!.id },
  });
  if (!campaign) return apiFailure("NOT_FOUND", "Campanha não encontrada.", 404);

  return apiSuccess({ campaign: serializeCampaign(campaign) });
}

export async function PUT(request: Request, context: RouteContext) {
  const { user, error } = await requireOngWithAccess(true);
  if (error) return error;
  const { campaignId } = await context.params;

  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, ongId: user!.id },
  });
  if (!existing) return apiFailure("NOT_FOUND", "Campanha não encontrada.", 404);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiFailure("INVALID_BODY", "Corpo inválido.", 400);
  }

  const category = body.category;
  const urgency = body.urgency;
  const status = body.status;

  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : existing.title,
      description:
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : existing.description,
      category: CAMPAIGN_CATEGORIES.includes(category as never)
        ? (category as never)
        : existing.category,
      urgency: CAMPAIGN_URGENCIES.includes(urgency as never) ? (urgency as never) : existing.urgency,
      status: CAMPAIGN_STATUSES.includes(status as never) ? (status as never) : existing.status,
      goalAmount:
        typeof body.goalAmount === "number"
          ? body.goalAmount
          : body.goalAmount === null
            ? null
            : existing.goalAmount,
      neededItems: Array.isArray(body.neededItems) ? (body.neededItems as string[]) : undefined,
      photos: Array.isArray(body.photos) ? (body.photos as string[]) : undefined,
      deadline:
        typeof body.deadline === "string" && body.deadline
          ? new Date(body.deadline)
          : body.deadline === null
            ? null
            : existing.deadline,
    },
  });

  return apiSuccess({ campaign: serializeCampaign(campaign) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { user, error } = await requireOngWithAccess(true);
  if (error) return error;
  const { campaignId } = await context.params;

  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, ongId: user!.id },
  });
  if (!existing) return apiFailure("NOT_FOUND", "Campanha não encontrada.", 404);

  await prisma.campaign.delete({ where: { id: campaignId } });
  return apiSuccess({ deleted: true });
}
