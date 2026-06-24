import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { profilePathForRole } from "@/lib/public-client/auth-redirect";

export default async function PerfilPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(profilePathForRole(user.role));
  }

  const { PublicProfilePagePremium } = await import(
    "@/components/features/public/pages/public-profile-page-premium"
  );
  return <PublicProfilePagePremium />;
}
