import { GestorSupportPanel } from "@/components/gestor/gestor-support";
import { GestorPageHeader } from "@/components/gestor/gestor-shell";

export default function GestorSupportPage() {
  return (
    <>
      <GestorPageHeader title="Suporte & Tickets" description="Central única Cliente ↔ ECOPET, Parceiro ↔ ECOPET, ONG ↔ ECOPET" />
      <GestorSupportPanel />
    </>
  );
}
