import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { canShop } from "@/lib/auth/shopper-roles";
import { CheckoutPanel } from "@/components/features/marketplace/checkout-panel";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/checkout");
  if (!canShop(user.role)) redirect(dashboardPathForRole(user.role));
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Checkout</h1>
      <CheckoutPanel />
    </main>
  );
}
