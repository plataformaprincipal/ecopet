import { AdminErpModulePanel } from "@/components/features/admin/admin-erp-module-panel";
import { getAdminModule } from "@/lib/admin/module-config";

export function AdminDashboardPanel() {
  const config = getAdminModule("dashboard")!;
  return <AdminErpModulePanel config={config} />;
}
