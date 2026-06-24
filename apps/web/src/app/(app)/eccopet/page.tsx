import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { PublicEccoPetPage } from "@/components/features/public/pages/public-eccopet-page";

export default async function EccoPetPage() {
  const user = await getCurrentUser();
  if (user?.role === UserRole.CLIENT) {
    redirect("/ia");
  }
  return <PublicEccoPetPage />;
}
