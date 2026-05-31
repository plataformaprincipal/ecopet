import { GestorPermissionsPanel } from "@/components/gestor/gestor-permissions";
import { GestorPageHeader } from "@/components/gestor/gestor-shell";

export default function GestorPermissionsPage() {
  return (
    <>
      <GestorPageHeader title="Permissões & Acessos" description="RBAC completo — cargos, departamentos e permissões granulares" />
      <GestorPermissionsPanel />
    </>
  );
}
