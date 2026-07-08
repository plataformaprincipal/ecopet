import { AdminModulePage } from "@/components/features/admin/admin-module-page";

export default function AdminComunidadeMensagensPage() {
  return <AdminModulePage moduleId="comunidade" initialFilters={{ type: "mensagens" }} />;
}
