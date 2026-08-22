import { StoryViewer } from "@/components/features/social/story-viewer";

export default async function SocialStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StoryViewer storyId={id} />;
}
