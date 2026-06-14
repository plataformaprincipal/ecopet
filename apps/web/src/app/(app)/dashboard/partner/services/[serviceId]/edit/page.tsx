import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { PartnerServicesPanel } from "@/components/features/foundation/partner-services-panel";

type Props = { params: Promise<{ serviceId: string }> };

export default async function PartnerServiceEditPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/partner/services");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));
  const { serviceId } = await params;
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Editar serviço</h1>
      <PartnerServicesPanel mode="edit" serviceId={serviceId} />
    </main>
  );
}
