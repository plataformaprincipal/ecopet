import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { serializeCampaign } from "@/lib/ong/serialize-campaign";

/** Campanhas ativas publicamente (somente ONGs aprovadas). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category")?.trim();

  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "ACTIVE",
      ...(category ? { category: category as never } : {}),
      ong: {
        accountStatus: "ACTIVE",
        ongProfile: { is: { verificationStatus: "APPROVED" } },
      },
    },
    orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
    take: 60,
    include: {
      ong: {
        select: { id: true, name: true, ongProfile: { select: { ongName: true, name: true } } },
      },
    },
  });

  return apiSuccess({
    campaigns: campaigns.map((c) => ({
      ...serializeCampaign(c),
      ong: {
        id: c.ong.id,
        name: c.ong.ongProfile?.ongName ?? c.ong.ongProfile?.name ?? c.ong.name,
      },
    })),
    total: campaigns.length,
  });
}
