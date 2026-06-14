import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { FoundationProfileForm } from "@/components/features/foundation/profile-form";

export default async function ClientProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/client/profile");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="mb-4 text-2xl font-semibold">Perfil do cliente</h1>
        <FoundationProfileForm dashboardPath="/dashboard/client" />
      </div>
    </main>
  );
}
