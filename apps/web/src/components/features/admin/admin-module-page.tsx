import { AdminErpModulePanel } from "@/components/features/admin/admin-erp-module-panel";
import { getAdminModule } from "@/lib/admin/module-config";
import { notFound } from "next/navigation";

type Props = { moduleId: string; initialFilters?: Record<string, string> };

export function AdminModulePage({ moduleId, initialFilters }: Props) {
  const config = getAdminModule(moduleId);
  if (!config) notFound();
  return <AdminErpModulePanel config={config} initialFilters={initialFilters} />;
}
