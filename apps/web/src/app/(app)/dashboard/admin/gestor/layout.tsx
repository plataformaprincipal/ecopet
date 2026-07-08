import { GestorLayout } from "@/components/features/gestor-admin/gestor-layout";
import { auditAdminAccess } from "@/lib/auth/auth-audit";
import { guardAdmin } from "@/lib/auth/guards";

export default async function GestorAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await guardAdmin("/dashboard/admin/gestor");
  void auditAdminAccess({ userId: user.id, path: "/dashboard/admin/gestor" });

  return <GestorLayout>{children}</GestorLayout>;
}
