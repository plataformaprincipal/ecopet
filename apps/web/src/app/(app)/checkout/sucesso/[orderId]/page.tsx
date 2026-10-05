import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutPayAgain } from "@/components/features/marketplace/checkout-pay-again";
import { CheckoutPaymentPoller } from "@/components/features/marketplace/checkout-payment-poller";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function CheckoutSuccessPage({ params }: PageProps) {
  const { orderId } = await params;
  const user = await getCurrentUser();

  const order = user
    ? await prisma.order.findFirst({
        where: { id: orderId, userId: user.id },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          payments: {
            where: { provider: "mercado_pago" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              paymentMethod: true,
              statusDetail: true,
              amount: true,
            },
          },
        },
      })
    : null;

  const payment = order?.payments[0];
  const method = String(payment?.paymentMethod || "").toLowerCase();
  // Query ?status= só é dica de UI; confirmação de pago vem apenas do banco.
  const statusLabel = payment?.status || order?.status || "PENDING";
  const confirming =
    order?.status === "PENDING_CONFIRMATION" ||
    payment?.status === "PROCESSING" ||
    payment?.status === "IN_PROCESS" ||
    payment?.status === "PENDING" ||
    payment?.status === "CREATED" ||
    payment?.status === "ACTION_REQUIRED";
  const paid = order?.status === "PAID";
  const failed = ["REJECTED", "CANCELLED", "EXPIRED", "ERROR"].includes(
    String(payment?.status || statusLabel)
  );
  const pixWaiting = !paid && !failed && (method === "pix" || method.includes("pix"));
  const boletoIssued = !paid && !failed && (method === "boleto" || method === "ticket" || method.includes("bol"));
  const canRetry =
    Boolean(order) &&
    order!.status !== "PAID" &&
    order!.status !== "CANCELLED" &&
    order!.status !== "REFUNDED" &&
    !confirming &&
    (!payment ||
      ["REJECTED", "CANCELLED", "EXPIRED", "ERROR", "PENDING", "CREATED"].includes(payment.status));

  return (
    <main className="mx-auto max-w-lg p-6">
      <Card>
        <CardContent className="space-y-4 p-6 text-center">
          <h1 className="text-2xl font-semibold">
            {paid
              ? "Pagamento aprovado"
              : failed
                ? "Pagamento recusado"
                : boletoIssued
                  ? "Boleto emitido"
                  : pixWaiting
                    ? "Pix aguardando pagamento"
                    : confirming
                      ? "Pagamento pendente"
                      : "Pagamento pendente"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {paid
              ? "Recebemos a confirmação do Mercado Pago. O pedido segue para o parceiro."
              : failed
                ? `Pagamento recusado (${payment?.status || statusLabel}${
                    payment?.statusDetail ? ` · ${payment.statusDetail}` : ""
                  }). Você pode tentar novamente.`
                : boletoIssued
                  ? "Boleto emitido. O pedido permanece pendente até a compensação. Não marcamos como pago na emissão."
                  : pixWaiting
                    ? "Pix aguardando pagamento. O pedido só será marcado como pago após confirmação do Mercado Pago."
                    : confirming
                      ? "Pagamento pendente. Estamos confirmando com o Mercado Pago. Não tente pagar de novo até ver o status final."
                      : "Conclua o pagamento online com cartão, Pix ou boleto. Pagamento na entrega não está disponível."}
          </p>
          {order ? (
            <p className="text-sm">
              Pedido #{order.orderNumber} · R$ {Number(order.total).toFixed(2)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">ID: {orderId}</p>
          )}
          {confirming && order ? <CheckoutPaymentPoller orderId={order.id} paymentId={payment?.id} /> : null}
          {canRetry && user?.email ? (
            <CheckoutPayAgain
              orderId={orderId}
              amount={Number(order?.total ?? 0)}
              payerEmail={user.email}
            />
          ) : null}
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/dashboard/client/orders">Meus pedidos</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/produtos">Continuar comprando</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
