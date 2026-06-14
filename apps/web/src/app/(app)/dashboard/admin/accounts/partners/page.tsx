import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { AdminAccountsPanel } from "@/components/features/foundation/admin-accounts-panel";

export default async function AdminPartnersAccountsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/admin/accounts/partners");
  if (user.role !== UserRole.ADMIN) redirect(dashboardPathForRole(user.role));

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-6 text-2xl font-semibold">Parceiros — aprovação</h1>
        <AdminAccountsPanel mode="partners" />
      </div>
    </main>
  );
}
