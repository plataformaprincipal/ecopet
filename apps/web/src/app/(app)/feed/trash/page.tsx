import { AppHeader } from "@/components/layouts/app-header";
import { SocialTrashPanel } from "@/components/features/social/feed/social-trash-panel";

export default function FeedTrashPage() {
  return (
    <>
      <AppHeader title="Lixeira" />
      <main className="mx-auto max-w-2xl flex-1 p-4">
        <SocialTrashPanel />
      </main>
    </>
  );
}
