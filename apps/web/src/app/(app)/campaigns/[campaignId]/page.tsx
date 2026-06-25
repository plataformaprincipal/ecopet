import { PublicCampaignDetail } from "@/components/features/public/ngo/public-campaign-detail";

export default async function CampaignDetailRoute({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  return <PublicCampaignDetail campaignId={campaignId} />;
}
