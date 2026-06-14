import { GestorPageHeader } from "@/components/features/gestor/gestor-shell";
import { CostCenterPanel } from "@/components/features/platform/gestor-centers";

export default function GestorCostsPage() {
  return (
    <>
      <GestorPageHeader title="Central de Custos" description="IA, APIs, e-mail, storage, robôs e integrações" />
      <CostCenterPanel />
    </>
  );
}
