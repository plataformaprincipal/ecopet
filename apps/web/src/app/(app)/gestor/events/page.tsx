import { GestorPageHeader } from "@/components/features/gestor/gestor-shell";
import { EventCenterPanel } from "@/components/features/platform/gestor-centers";

export default function GestorEventsPage() {
  return (
    <>
      <GestorPageHeader title="Event Center" description="Central de eventos alimentando BI, IA, robôs e auditoria" />
      <EventCenterPanel />
    </>
  );
}
