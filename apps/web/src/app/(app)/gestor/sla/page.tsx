import { GestorPageHeader } from "@/components/features/gestor/gestor-shell";
import { SlaCenterPanel } from "@/components/features/platform/gestor-centers";

export default function GestorSlaPage() {
  return (
    <>
      <GestorPageHeader title="SLA Center" description="Suporte, denúncias, chats, adoções e campanhas" />
      <SlaCenterPanel />
    </>
  );
}
