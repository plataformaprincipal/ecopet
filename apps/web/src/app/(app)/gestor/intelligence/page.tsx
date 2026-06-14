import { GestorPageHeader } from "@/components/features/gestor/gestor-shell";
import { IntelligencePanel } from "@/components/features/platform/gestor-centers";

export default function GestorIntelligencePage() {
  return (
    <>
      <GestorPageHeader title="EcoPet Intelligence" description="IA corporativa — insights, riscos, fraudes e previsões" />
      <IntelligencePanel scope="GESTOR" />
    </>
  );
}
