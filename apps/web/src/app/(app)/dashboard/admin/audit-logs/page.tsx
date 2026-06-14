import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { AdminAuditLogsPanel } from "@/components/features/foundation/admin-audit-logs-panel";

export default async function AdminAuditLogsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/admin/audit-logs");
  if (user.role !== UserRole.ADMIN) redirect(dashboardPathForRole(user.role));
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Histórico de auditoria</h1>
      <AdminAuditLogsPanel />
    </main>
  );
}
