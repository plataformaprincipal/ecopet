"use client";

import { GestorChangePasswordForm } from "@/components/features/gestor/gestor-change-password";
import { GestorPageHeader } from "@/components/features/gestor/gestor-shell";

export default function GestorChangePasswordPage() {
  return (
    <>
      <GestorPageHeader
        title="Primeiro Acesso — Segurança"
        description="Defina sua nova senha para acessar o painel Gestor ECOPET"
      />
      <GestorChangePasswordForm />
    </>
  );
}
