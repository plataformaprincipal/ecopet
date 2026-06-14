import { GestorPageHeader } from "@/components/features/gestor/gestor-shell";
import { GovernancePanel } from "@/components/features/platform/gestor-centers";

export default function GestorGovernancePage() {
  return (
    <>
      <GestorPageHeader title="Governança & Compliance" description="LGPD corporativa, multiorganização e retenção de dados" />
      <GovernancePanel />
    </>
  );
}
