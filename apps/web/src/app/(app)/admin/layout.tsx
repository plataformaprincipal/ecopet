import { redirect } from "next/navigation";
import { AccountStatus, UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { AdminLayout } from "@/components/features/admin/admin-layout";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");
  if (user.role !== UserRole.ADMIN) redirect(dashboardPathForRole(user.role));
  if (user.accountStatus !== AccountStatus.ACTIVE) redirect("/perfil");

  return <AdminLayout>{children}</AdminLayout>;
}
