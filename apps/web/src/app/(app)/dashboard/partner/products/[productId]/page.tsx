import { redirect } from "next/navigation";
import { Suspense } from "react";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ProductCreatedBanner, ProductDetailActions } from "@/components/features/marketplace/partner-product-detail-client";

type Props = { params: Promise<{ productId: string }> };

export default async function PartnerProductDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/partner/products");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));
  const { productId } = await params;
  return (
    <main className="mx-auto max-w-2xl p-6">
      <Suspense fallback={null}>
        <ProductCreatedBanner />
      </Suspense>
      <h1 className="mb-4 text-2xl font-semibold">Produto</h1>
      <p className="text-sm text-muted-foreground">ID: {productId}</p>
      <ProductDetailActions productId={productId} />
    </main>
  );
}
