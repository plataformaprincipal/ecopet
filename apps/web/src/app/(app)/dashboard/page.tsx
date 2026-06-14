import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { FoundationDashboard } from "@/components/foundation/dashboard";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <FoundationDashboard user={user} />
    </main>
  );
}
