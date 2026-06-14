import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { AdminIntegrationsPanel } from "@/components/features/admin/integrations-panel";

export default async function AdminIntegrationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/admin/integrations");
  if (user.role !== UserRole.ADMIN) redirect(dashboardPathForRole(user.role));

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">Central de integrações</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Status real das integrações externas — sem métricas fictícias e sem exposição de secrets.
      </p>
      <AdminIntegrationsPanel />
      <Link href="/dashboard/admin" className="mt-6 inline-block text-sm underline">Voltar</Link>
    </main>
  );
}
