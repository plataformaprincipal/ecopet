import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { AdminPaymentsPanel } from "@/components/features/admin/payments-panels";

export default async function AdminPaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/admin/payments");
  if (user.role !== UserRole.ADMIN) redirect(dashboardPathForRole(user.role));

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Pagamentos</h1>
      <AdminPaymentsPanel />
      <Link href="/dashboard/admin/integrations" className="mt-4 inline-block text-sm underline">Integrações</Link>
    </main>
  );
}
