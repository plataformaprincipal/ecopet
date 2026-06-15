import { AppHeader } from "@/components/layouts/app-header";
import { AdminSocialModerationPanel } from "@/components/features/social/feed/admin-social-moderation-panel";

export default function AdminSocialCommentsPage() {
  return (
    <>
      <AppHeader title="Moderação — Comentários" />
      <main className="mx-auto max-w-3xl flex-1 p-4">
        <AdminSocialModerationPanel type="comments" />
      </main>
    </>
  );
}
