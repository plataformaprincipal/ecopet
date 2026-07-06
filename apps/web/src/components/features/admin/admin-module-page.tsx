import { AdminModulePanel } from "@/components/features/admin/ui/admin-module-panel";
import { getAdminModule } from "@/lib/admin/module-config";
import { notFound } from "next/navigation";

type Props = { moduleId: string };

export function AdminModulePage({ moduleId }: Props) {
  const config = getAdminModule(moduleId);
  if (!config) notFound();
  return <AdminModulePanel config={config} />;
}
