import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { FoundationProfileForm } from "@/components/features/foundation/profile-form";

export default async function PartnerProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/partner/profile");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="mb-4 text-2xl font-semibold">Perfil do parceiro</h1>
        {user.accountStatus === "PENDING" && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Sua conta está em análise. Complete o perfil enquanto aguarda aprovação administrativa.
          </p>
        )}
        <FoundationProfileForm dashboardPath="/dashboard/partner" />
      </div>
    </main>
  );
}
