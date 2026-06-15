import { AppHeader } from "@/components/layouts/app-header";
import { AdminSocialModerationPanel } from "@/components/features/social/feed/admin-social-moderation-panel";

export default function AdminSocialPostsPage() {
  return (
    <>
      <AppHeader title="Moderação — Posts" />
      <main className="mx-auto max-w-3xl flex-1 p-4">
        <AdminSocialModerationPanel type="posts" />
      </main>
    </>
  );
}
