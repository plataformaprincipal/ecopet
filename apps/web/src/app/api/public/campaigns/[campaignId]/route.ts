import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { serializeCampaign } from "@/lib/ong/serialize-campaign";

type RouteContext = { params: Promise<{ campaignId: string }> };

/** Detalhe público de uma campanha ativa. */
export async function GET(_request: Request, context: RouteContext) {
  const { campaignId } = await context.params;

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      status: { in: ["ACTIVE", "COMPLETED"] },
      ong: {
        accountStatus: "ACTIVE",
        ongProfile: { is: { verificationStatus: "APPROVED" } },
      },
    },
    include: {
      ong: {
        select: {
          id: true,
          name: true,
          ongProfile: { select: { ongName: true, name: true, city: true, state: true, description: true } },
        },
      },
    },
  });

  if (!campaign) {
    return apiFailure("NOT_FOUND", "Campanha não encontrada.", 404);
  }

  return apiSuccess({
    campaign: {
      ...serializeCampaign(campaign),
      ong: {
        id: campaign.ong.id,
        name: campaign.ong.ongProfile?.ongName ?? campaign.ong.ongProfile?.name ?? campaign.ong.name,
        city: campaign.ong.ongProfile?.city ?? null,
        state: campaign.ong.ongProfile?.state ?? null,
        description: campaign.ong.ongProfile?.description ?? null,
      },
    },
  });
}
