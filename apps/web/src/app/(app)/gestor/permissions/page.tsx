import { GestorPermissionsPanel } from "@/components/features/gestor/gestor-permissions";
import { GestorPageHeader } from "@/components/features/gestor/gestor-shell";

export default function GestorPermissionsPage() {
  return (
    <>
      <GestorPageHeader title="Permissões & Acessos" description="RBAC completo — cargos, departamentos e permissões granulares" />
      <GestorPermissionsPanel />
    </>
  );
}
