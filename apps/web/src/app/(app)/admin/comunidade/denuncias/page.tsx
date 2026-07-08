import { AdminModulePage } from "@/components/features/admin/admin-module-page";

export default function AdminComunidadeDenunciasPage() {
  return <AdminModulePage moduleId="comunidade" initialFilters={{ type: "denuncias" }} />;
}
