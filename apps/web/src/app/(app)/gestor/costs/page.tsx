import { GestorPageHeader } from "@/components/gestor/gestor-shell";
import { CostCenterPanel } from "@/components/platform/gestor-centers";

export default function GestorCostsPage() {
  return (
    <>
      <GestorPageHeader title="Central de Custos" description="IA, APIs, e-mail, storage, robôs e integrações" />
      <CostCenterPanel />
    </>
  );
}
