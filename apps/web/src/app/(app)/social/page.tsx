import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { PublicSocialPage } from "@/components/features/public/pages/public-social-page";

export default async function SocialPage() {
  const user = await getCurrentUser();
  if (user?.role === UserRole.CLIENT) {
    redirect("/feed");
  }
  return <PublicSocialPage />;
}
