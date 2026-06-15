import { AppHeader } from "@/components/layouts/app-header";
import { PublicProfilePage } from "@/components/features/social/feed/public-profile-page";

type Props = { params: Promise<{ userId: string }> };

export default async function FeedProfilePage({ params }: Props) {
  const { userId } = await params;
  return (
    <>
      <AppHeader title="Perfil" />
      <main className="mx-auto max-w-2xl flex-1 p-4">
        <PublicProfilePage userId={userId} />
      </main>
    </>
  );
}
