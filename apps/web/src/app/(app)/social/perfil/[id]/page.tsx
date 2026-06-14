import { ProfilePageContent } from "@/components/features/social/profile-page-content";

export default async function SocialPerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProfilePageContent profileId={id} />;
}
