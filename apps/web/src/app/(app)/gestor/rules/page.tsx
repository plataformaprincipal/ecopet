import { GestorPageHeader } from "@/components/features/gestor/gestor-shell";
import { RulesEnginePanel } from "@/components/features/platform/gestor-centers";

export default function GestorRulesPage() {
  return (
    <>
      <GestorPageHeader title="Motor de Regras" description="Regras SE → ENTÃO por cliente, parceiro, ONG e gestor" />
      <RulesEnginePanel />
    </>
  );
}
