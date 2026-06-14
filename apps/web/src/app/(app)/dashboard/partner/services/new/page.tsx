import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { PartnerServicesPanel } from "@/components/features/foundation/partner-services-panel";

export default async function PartnerServiceNewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/partner/services/new");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Novo serviço</h1>
      <PartnerServicesPanel mode="new" />
    </main>
  );
}
