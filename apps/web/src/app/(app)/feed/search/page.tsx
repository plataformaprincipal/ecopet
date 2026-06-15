import { AppHeader } from "@/components/layouts/app-header";
import { SocialSearch } from "@/components/features/social/feed/social-search";

export default function FeedSearchPage() {
  return (
    <>
      <AppHeader title="Buscar" />
      <main className="mx-auto max-w-2xl flex-1 p-4">
        <SocialSearch />
      </main>
    </>
  );
}
