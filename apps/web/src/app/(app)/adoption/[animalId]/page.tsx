import { PublicAnimalDetail } from "@/components/features/public/ngo/public-animal-detail";

export default async function AnimalDetailRoute({
  params,
}: {
  params: Promise<{ animalId: string }>;
}) {
  const { animalId } = await params;
  return <PublicAnimalDetail listingId={animalId} />;
}
