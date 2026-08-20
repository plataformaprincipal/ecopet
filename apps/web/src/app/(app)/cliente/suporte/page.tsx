import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { SupportHub } from "@/components/features/messages/support-hub";

export default async function ClientSupportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cliente/suporte");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));
  return (
    <main className="mx-auto max-w-3xl p-4 lg:p-8">
      <SupportHub />
    </main>
  );
}
