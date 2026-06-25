import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { OngCommunityPage } from "@/components/features/ong/pages/ong-community-page";

export default async function NgoSocialRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/ngo/social");
  if (user.role !== UserRole.ONG) redirect(dashboardPathForRole(user.role));

  return <OngCommunityPage ongId={user.id} accessLevel="full" />;
}
