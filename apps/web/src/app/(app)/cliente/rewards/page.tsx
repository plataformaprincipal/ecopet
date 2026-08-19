import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { RewardsWorkspace } from "@/components/features/rewards/rewards-workspace";

export default async function ClientRewardsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cliente/rewards");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));
  return (
    <main className="mx-auto max-w-3xl flex-1 p-4 lg:p-8">
      <RewardsWorkspace />
    </main>
  );
}
