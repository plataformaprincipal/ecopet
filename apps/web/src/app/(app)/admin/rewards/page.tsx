import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { AdminRewardsPanel } from "@/components/features/admin/admin-rewards-panel";

export default async function AdminRewardsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/rewards");
  if (user.role !== UserRole.ADMIN) redirect("/unauthorized");
  return <AdminRewardsPanel />;
}
