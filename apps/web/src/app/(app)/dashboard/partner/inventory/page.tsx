import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { PartnerInventoryPanel } from "@/components/features/marketplace/orders-panels";

export default async function PartnerInventoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/partner/inventory");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Estoque</h1>
      <PartnerInventoryPanel />
      <Link href="/dashboard/partner/products" className="mt-4 inline-block text-sm underline">Produtos</Link>
    </main>
  );
}
