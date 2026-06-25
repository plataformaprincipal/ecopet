import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SocialHub } from "@/components/features/social/hub/social-hub";

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/social");
  }
  return <SocialHub />;
}
