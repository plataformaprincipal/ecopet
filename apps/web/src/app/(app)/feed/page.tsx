import { AppHeader } from "@/components/layouts/app-header";
import { SocialFeed } from "@/components/features/social/feed/social-feed";

export default function FeedPage() {
  return (
    <>
      <AppHeader titleKey="socialFeed.title" />
      <main className="mx-auto max-w-2xl flex-1 p-4">
        <SocialFeed />
      </main>
    </>
  );
}
