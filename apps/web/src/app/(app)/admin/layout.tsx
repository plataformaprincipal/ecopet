import { AdminLayout } from "@/components/features/admin/admin-layout";
import { auditAdminAccess } from "@/lib/auth/auth-audit";
import { guardAdmin } from "@/lib/auth/guards";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const user = await guardAdmin("/admin");
  void auditAdminAccess({ userId: user.id, path: "/admin" });

  return <AdminLayout>{children}</AdminLayout>;
}
