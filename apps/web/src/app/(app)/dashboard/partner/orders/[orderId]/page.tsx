import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { PartnerOrdersPanel } from "@/components/features/marketplace/orders-panels";

type PageProps = { params: Promise<{ orderId: string }> };

export default async function PartnerOrderDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/partner/orders");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));
  const { orderId } = await params;
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Gerenciar pedido</h1>
      <PartnerOrdersPanel mode="detail" orderId={orderId} />
      <Link href="/dashboard/partner/orders" className="mt-4 inline-block text-sm underline">Voltar</Link>
    </main>
  );
}
