import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { PartnerProductsPanel } from "@/components/features/marketplace/partner-products-panel";

export default async function PartnerProductsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/partner/products");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Meus produtos</h1>
      <PartnerProductsPanel />
    </main>
  );
}
