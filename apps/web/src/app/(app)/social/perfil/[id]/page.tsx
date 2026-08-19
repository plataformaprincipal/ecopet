import { redirect } from "next/navigation";

export default async function SocialPerfilRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/feed/profile/${id}`);
}
