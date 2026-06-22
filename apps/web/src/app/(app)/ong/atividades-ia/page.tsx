import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { OngAIActivitiesPage } from "@/components/features/ong/pages/ong-ai-activities-page";

export default async function OngAIActivitiesRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/ong/atividades-ia");
  if (user.role !== UserRole.ONG) redirect(dashboardPathForRole(user.role));

  return <OngAIActivitiesPage />;
}
