import { GestorPageHeader } from "@/components/gestor/gestor-shell";
import { WorkflowCenterHub } from "@/components/platform/workflow-visual-builder";

export default function GestorWorkflowsPage() {
  return (
    <>
      <GestorPageHeader
        title="Workflow Center"
        description="Construtor visual Quando → Então — arraste, conecte e publique automações"
      />
      <WorkflowCenterHub />
    </>
  );
}
