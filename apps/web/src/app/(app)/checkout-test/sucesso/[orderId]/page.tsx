import { checkoutTestAmount, testStatus } from "@/lib/mercado-pago/checkout-test-isolation";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutTestBanner } from "@/components/features/marketplace/checkout-test-banner";
import { CheckoutTestPaymentPoller } from "@/components/features/marketplace/checkout-test-payment-poller";
import { isCheckoutTestOrderNotes } from "@/lib/mercado-pago/test-credentials";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout de teste — resultado",
  robots: { index: false, follow: false, nocache: true },
};

export default async function CheckoutTestSuccessPage({ params }: PageProps) {
  const { orderId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/checkout-test");

  const order = user
    ? await prisma.order.findFirst({
        where: { id: orderId, userId: user.id },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          deliveryNotes: true,
          pricingSnapshot: true,
          payments: {
            where: { provider: "mercado_pago", environment: "test" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              paymentMethod: true,
              statusDetail: true,
              amount: true,
              providerOrderId: true,
              metadata: true,
            },
          },
        },
      })
    : null;

  const isTestOrder = Boolean(order && isCheckoutTestOrderNotes(order.deliveryNotes));
  const payment = isTestOrder ? order?.payments[0] : undefined;
  const meta = (payment?.metadata as Record<string, unknown> | null) ?? {};
  const mpOrderId =
    payment?.providerOrderId ||
    (typeof meta.mercadoPagoOrderId === "string" ? meta.mercadoPagoOrderId : null);
  const statusLabel = (payment ? testStatus(payment.status) : null) || order?.status || "PENDING";
  const confirming =
    order?.status === "PENDING_CONFIRMATION" ||
    (payment && testStatus(payment.status) === "PROCESSING") ||
    (payment && testStatus(payment.status) === "IN_PROCESS");
  const paid = payment && testStatus(payment.status) === "APPROVED";
  const failed = ["REJECTED", "CANCELLED", "EXPIRED", "ERROR"].includes(
    String(payment ? testStatus(payment.status) : statusLabel)
  );

  return (
    <main className="mx-auto max-w-lg space-y-4 p-6">
      <CheckoutTestBanner />
      <Card>
        <CardContent className="space-y-4 p-6 text-center">
          <h1 className="text-2xl font-semibold">
            {!isTestOrder
              ? "Pedido de teste não encontrado"
              : paid
                ? "Pagamento de teste confirmado"
                : confirming
                  ? "Pagamento de teste em confirmação"
                  : failed
                    ? "Pagamento de teste não concluído"
                    : "Pedido de teste registrado"}
          </h1>
          {isTestOrder && order ? (
            <p className="text-sm">
              Pedido #{order.orderNumber} · R$ {checkoutTestAmount(order).toFixed(2)}
            </p>
          ) : null}
          {mpOrderId ? (
            <div className="rounded border border-dashed px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground">Mercado Pago Order ID</p>
              <p className="break-all font-mono font-semibold">{mpOrderId}</p>
            </div>
          ) : isTestOrder ? (
            <p className="text-xs text-muted-foreground">
              Mercado Pago Order ID ainda não persistido. Aguarde a confirmação.
            </p>
          ) : null}
          {payment ? (
            <p className="text-sm text-muted-foreground">
              Status TEST: {testStatus(payment.status)}
              {payment.statusDetail ? ` (${payment.statusDetail})` : ""}
            </p>
          ) : null}
          {confirming && isTestOrder && order ? (
            <CheckoutTestPaymentPoller orderId={order.id} paymentId={payment?.id} />
          ) : null}
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/inicio">Voltar ao EccoPet</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/checkout-test">Consultar teste</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
