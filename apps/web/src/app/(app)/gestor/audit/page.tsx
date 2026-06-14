import { GestorAuditPanel } from "@/components/features/gestor/gestor-audit";
import { GestorPageHeader } from "@/components/features/gestor/gestor-shell";

export default function GestorAuditPage() {
  return (
    <>
      <GestorPageHeader title="Auditoria & Logs" description="Rastreamento completo de ações na plataforma" />
      <GestorAuditPanel />
    </>
  );
}
