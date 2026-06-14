import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { AdminOrdersPanel } from "@/components/features/marketplace/orders-panels";

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/admin/orders");
  if (user.role !== UserRole.ADMIN) redirect(dashboardPathForRole(user.role));
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Pedidos (auditoria)</h1>
      <AdminOrdersPanel />
      <Link href="/dashboard/admin" className="mt-4 inline-block text-sm underline">Voltar</Link>
    </main>
  );
}
