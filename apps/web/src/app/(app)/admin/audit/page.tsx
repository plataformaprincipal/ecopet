import { AdminSectionPanel } from "@/components/features/admin/admin-section-panel";

export default function AdminAuditPage() {
  return (
    <AdminSectionPanel
      title="Auditoria"
      description="Logs administrativos e ações sensíveis."
      endpoint="audit"
      showFilters
    />
  );
}
