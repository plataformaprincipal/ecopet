import { AdminModulePage } from "@/components/features/admin/admin-module-page";

export default function AdminSuporteClientesPage() {
  return <AdminModulePage moduleId="suporte" initialFilters={{ type: "clientes" }} />;
}
