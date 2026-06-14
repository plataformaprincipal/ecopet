import { GestorApprovalsPanel } from "@/components/features/gestor/gestor-approvals";
import { GestorPageHeader } from "@/components/features/gestor/gestor-shell";

export default function GestorApprovalsPage() {
  return (
    <>
      <GestorPageHeader title="Cadastro & Aprovações" description="Clientes, parceiros, ONGs, produtos e serviços — com análise de risco IA" />
      <GestorApprovalsPanel />
    </>
  );
}
