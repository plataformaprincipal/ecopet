import { PostDetailContent } from "@/components/features/social/post-detail-content";

export default async function SocialPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetailContent postId={id} />;
}
