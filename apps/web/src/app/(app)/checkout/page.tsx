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
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Checkout</h1>
        <p className="text-sm text-muted-foreground">Revise o pedido e pague com cartão, Pix ou boleto.</p>
      </header>
      <CheckoutPanel />
    </main>
  );
}
