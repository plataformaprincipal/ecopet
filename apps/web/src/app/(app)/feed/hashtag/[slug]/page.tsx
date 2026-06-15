import { AppHeader } from "@/components/layouts/app-header";
import { SocialFeed } from "@/components/features/social/feed/social-feed";

type Props = { params: Promise<{ slug: string }> };

export default async function HashtagPage({ params }: Props) {
  const { slug } = await params;
  return (
    <>
      <AppHeader title={`#${slug}`} />
      <main className="mx-auto max-w-2xl flex-1 p-4">
        <SocialFeed hashtag={slug} />
      </main>
    </>
  );
}
