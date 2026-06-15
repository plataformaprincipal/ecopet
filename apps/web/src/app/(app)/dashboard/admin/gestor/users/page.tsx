import { GestorSectionPanel } from "@/components/features/gestor-admin/gestor-section-panel";

export default function GestorUsersPage() {
  return (
    <GestorSectionPanel
      title="Usuários"
      description="Listagem com CPF mascarado — sem senhas ou tokens."
      endpoint="users"
      exportType="users"
    />
  );
}
