import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { CheckoutPanel } from "@/components/features/marketplace/checkout-panel";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/checkout");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Checkout</h1>
      <CheckoutPanel />
    </main>
  );
}
