import { AdminModulePage } from "@/components/features/admin/admin-module-page";

export default function AdminComunidadeMembrosPage() {
  return <AdminModulePage moduleId="comunidade" initialFilters={{ type: "membros" }} />;
}
