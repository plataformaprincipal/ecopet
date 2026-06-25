import { PublicNgoProfile } from "@/components/features/public/ngo/public-ngo-profile";

export default async function NgoPublicProfileRoute({
  params,
}: {
  params: Promise<{ ngoId: string }>;
}) {
  const { ngoId } = await params;
  return <PublicNgoProfile ngoId={ngoId} />;
}
