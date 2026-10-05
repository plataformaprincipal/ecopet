import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { checkoutTestAmount } from "@/lib/mercado-pago/checkout-test-isolation";
import { CHECKOUT_TEST_NOTE_PREFIX } from "@/lib/mercado-pago/test-credentials";
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
  const existing = await prisma.order.findFirst({ where: { userId: user.id, deliveryNotes: { startsWith: CHECKOUT_TEST_NOTE_PREFIX } }, orderBy: { createdAt: "desc" } });
  const amount = existing ? checkoutTestAmount(existing) : 0;
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Checkout de teste</h1>
      <p className="text-sm text-muted-foreground">
        Rota temporária e isolada para uma compra Mercado Pago TEST no domínio de produção. O
        checkout normal não é usado. Acesso exclusivo para usuários autenticados.
      </p>
      <CheckoutTestPanel initialOrder={existing && amount ? { id: existing.id, total: amount } : null} />
    </main>
  );
}
