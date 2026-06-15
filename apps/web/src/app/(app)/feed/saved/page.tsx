import { AppHeader } from "@/components/layouts/app-header";
import { SavedPostsPanel } from "@/components/features/social/feed/saved-posts-panel";

export default function FeedSavedPage() {
  return (
    <>
      <AppHeader title="Salvos" />
      <main className="mx-auto max-w-2xl flex-1 p-4">
        <SavedPostsPanel />
      </main>
    </>
  );
}
