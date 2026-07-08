import { AdminModulePage } from "@/components/features/admin/admin-module-page";

export default function AdminSuporteInternoPage() {
  return <AdminModulePage moduleId="suporte" initialFilters={{ type: "interno" }} />;
}
