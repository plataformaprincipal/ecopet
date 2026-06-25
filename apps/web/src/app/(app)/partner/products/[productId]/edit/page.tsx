import { PartnerProductsPanel } from "@/components/features/marketplace/partner-products-panel";

type Props = { params: Promise<{ productId: string }> };

export default async function PartnerProductEditRoute({ params }: Props) {
  const { productId } = await params;
  return <PartnerProductsPanel mode="edit" productId={productId} />;
}
