import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { AdminPrivacyRequestsPanel } from "@/components/features/admin/privacy-requests-panel";

export default async function AdminPrivacyRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/admin/privacy-requests");
  if (user.role !== UserRole.ADMIN) redirect(dashboardPathForRole(user.role));

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">Solicitações LGPD</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Exportação, exclusão, retificação e revogação de consentimento — dados reais do banco.
      </p>
      <AdminPrivacyRequestsPanel />
    </main>
  );
}
