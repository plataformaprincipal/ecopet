import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { GestorLayout } from "@/components/features/gestor-admin/gestor-layout";

export default async function GestorAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/admin/gestor");
  if (user.role !== UserRole.ADMIN) redirect(dashboardPathForRole(user.role));

  return <GestorLayout>{children}</GestorLayout>;
}
