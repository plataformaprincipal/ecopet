import { GestorPageHeader } from "@/components/gestor/gestor-shell";
import { GovernancePanel } from "@/components/platform/gestor-centers";

export default function GestorGovernancePage() {
  return (
    <>
      <GestorPageHeader title="Governança & Compliance" description="LGPD corporativa, multiorganização e retenção de dados" />
      <GovernancePanel />
    </>
  );
}
