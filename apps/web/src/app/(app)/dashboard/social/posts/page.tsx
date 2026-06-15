import { AppHeader } from "@/components/layouts/app-header";
import { SocialFeed } from "@/components/features/social/feed/social-feed";

export default function DashboardSocialPostsPage() {
  return (
    <>
      <AppHeader title="Meus posts" />
      <main className="mx-auto max-w-2xl flex-1 p-4">
        <SocialFeed />
      </main>
    </>
  );
}
