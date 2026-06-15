import Link from "next/link";
import { AppHeader } from "@/components/layouts/app-header";
import { SocialFeed } from "@/components/features/social/feed/social-feed";

export default function DashboardSocialPage() {
  return (
    <>
      <AppHeader title="Social" />
      <main className="mx-auto max-w-2xl flex-1 space-y-4 p-4">
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link href="/dashboard/social/posts" className="text-ecopet-primary hover:underline">Meus posts</Link>
          <Link href="/feed/saved" className="text-ecopet-primary hover:underline">Salvos</Link>
          <Link href="/feed/profile/me" className="text-ecopet-primary hover:underline">Perfil público</Link>
        </nav>
        <SocialFeed />
      </main>
    </>
  );
}
