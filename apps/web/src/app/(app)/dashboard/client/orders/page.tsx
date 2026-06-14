import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientOrdersPanel } from "@/components/features/marketplace/orders-panels";

export default async function ClientOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/client/orders");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Meus pedidos</h1>
      <ClientOrdersPanel />
      <Link href="/dashboard/client" className="mt-4 inline-block text-sm underline">Voltar</Link>
    </main>
  );
}
