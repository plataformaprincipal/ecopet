"use client";

import { CreateMasterAdminForm } from "@/components/features/gestor/create-master-admin-form";
import { GestorPageHeader } from "@/components/features/gestor/gestor-shell";

export default function GestorAtivacaoPage() {
  return (
    <>
      <GestorPageHeader
        title="Ativação do Sistema ECOPET"
        description="Etapa única de bootstrap — crie o Super Administrador Master definitivo"
      />
      <CreateMasterAdminForm />
    </>
  );
}
