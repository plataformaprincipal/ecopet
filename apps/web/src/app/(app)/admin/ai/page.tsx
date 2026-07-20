import { AdminAiExecutivePanel } from "@/components/features/admin/admin-ai-executive-panel";
import { AdminAiPlatformPanel } from "@/components/features/admin/admin-ai-platform-panel";

export default function AdminAiDashboardPage() {
  return (
    <div className="space-y-8">
      <AdminAiExecutivePanel />
      <div className="border-t pt-4">
        <AdminAiPlatformPanel />
      </div>
    </div>
  );
}
