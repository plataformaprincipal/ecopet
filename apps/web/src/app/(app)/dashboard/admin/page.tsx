import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { FoundationRolePanel } from "@/components/features/foundation/role-panel";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/admin");
  if (user.role !== UserRole.ADMIN) redirect(dashboardPathForRole(user.role));

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <FoundationRolePanel
          user={user}
          title="Painel Administrativo"
          description="Área de administração da plataforma ECOPET."
        />
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/admin/gestor">Gestor EcoPet (BI)</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/gestor/reports">Relatórios</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/gestor/overview">BI</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/gestor/audit">Auditoria</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/privacy-requests">LGPD</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/accounts">Aprovação de contas</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/integrations">Integrações</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/audit-logs">Histórico de auditoria</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/gestor">Console gestor (legado)</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
