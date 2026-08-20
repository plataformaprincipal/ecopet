import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientOrdersPanel } from "@/components/features/marketplace/orders-panels";

export default async function ClientPedidosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cliente/pedidos");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));
  return (
    <main className="mx-auto max-w-3xl p-4 lg:p-8">
      <h1 className="mb-4 font-display text-2xl font-semibold">Pedidos</h1>
      <ClientOrdersPanel mode="list" />
    </main>
  );
}
