import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutTestPanel } from "@/components/features/marketplace/checkout-test-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout de teste",
  robots: { index: false, follow: false, nocache: true },
};

export default async function CheckoutTestPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/checkout-test");
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Checkout de teste</h1>
      <p className="text-sm text-muted-foreground">
        Pagamento online Mercado Pago TEST. O checkout normal e o pagamento na entrega não são
        usados.
      </p>
      <CheckoutTestPanel />
    </main>
  );
}
