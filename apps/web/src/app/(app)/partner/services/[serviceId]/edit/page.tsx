import { PartnerServicesPanel } from "@/components/features/foundation/partner-services-panel";

type Props = { params: Promise<{ serviceId: string }> };

export default async function PartnerServiceEditRoute({ params }: Props) {
  const { serviceId } = await params;
  return <PartnerServicesPanel mode="edit" serviceId={serviceId} />;
}
