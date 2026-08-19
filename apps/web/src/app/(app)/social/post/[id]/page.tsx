import { redirect } from "next/navigation";

export default async function SocialPostRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/feed/post/${id}`);
}
