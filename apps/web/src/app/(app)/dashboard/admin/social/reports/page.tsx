import { AppHeader } from "@/components/layouts/app-header";
import { AdminSocialReportsPanel } from "@/components/features/social/feed/admin-social-reports-panel";

export default function AdminSocialReportsPage() {
  return (
    <>
      <AppHeader title="Denúncias sociais" />
      <main className="mx-auto max-w-3xl flex-1 p-4">
        <AdminSocialReportsPanel />
      </main>
    </>
  );
}
