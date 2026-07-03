import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireOngWithAccess } from "@/lib/ong/require-ong-access";
import {
  serializeCampaign,
  CAMPAIGN_CATEGORIES,
  CAMPAIGN_STATUSES,
  CAMPAIGN_URGENCIES,
} from "@/lib/ong/serialize-campaign";

type AnyCampaignCategory = (typeof CAMPAIGN_CATEGORIES)[number];
type AnyCampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
type AnyCampaignUrgency = (typeof CAMPAIGN_URGENCIES)[number];

export async function GET() {
  const { user, error } = await requireOngWithAccess();
  if (error) return error;

  const campaigns = await prisma.campaign.findMany({
    where: { ongId: user!.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return apiSuccess({ campaigns: campaigns.map(serializeCampaign) });
}

export async function POST(request: Request) {
  const { user, error } = await requireOngWithAccess(true);
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiFailure("INVALID_BODY", "Corpo inválido.", 400);
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = body.category as AnyCampaignCategory;

  if (!title || title.length < 3) {
    return apiFailure("VALIDATION_ERROR", "Título obrigatório.", 400);
  }
  if (!description || description.length < 10) {
    return apiFailure("VALIDATION_ERROR", "Descrição muito curta.", 400);
  }
  if (!CAMPAIGN_CATEGORIES.includes(category)) {
    return apiFailure("VALIDATION_ERROR", "Categoria inválida.", 400);
  }

  const urgency = (CAMPAIGN_URGENCIES.includes(body.urgency as AnyCampaignUrgency)
    ? body.urgency
    : "NORMAL") as AnyCampaignUrgency;
  const status = (CAMPAIGN_STATUSES.includes(body.status as AnyCampaignStatus)
    ? body.status
    : "DRAFT") as AnyCampaignStatus;

  const campaign = await prisma.campaign.create({
    data: {
      ongId: user!.id,
      title,
      description,
      category,
      urgency,
      status,
      goalAmount: typeof body.goalAmount === "number" ? body.goalAmount : null,
      neededItems: Array.isArray(body.neededItems) ? (body.neededItems as string[]) : [],
      photos: Array.isArray(body.photos) ? (body.photos as string[]) : [],
      deadline: typeof body.deadline === "string" && body.deadline ? new Date(body.deadline) : null,
    },
  });

  return apiSuccess({ campaign: serializeCampaign(campaign) }, 201);
}
