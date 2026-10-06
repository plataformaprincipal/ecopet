import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutPayAgain } from "@/components/features/marketplace/checkout-pay-again";
import { CheckoutPaymentPoller } from "@/components/features/marketplace/checkout-payment-poller";
import { CheckoutPolicies } from "@/components/features/marketplace/checkout-policies";
import { PIX_WAIT_MS } from "@/lib/checkout/payment-wait";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

const DIGITAL_TYPES = new Set(["DIGITAL_AI", "CATALOG_SKU", "AI_PRODUCT", "AI_CREDIT"]);

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
          partnerId: true,
          items: { select: { itemType: true, sku: true, name: true, partnerId: true } },
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

  const items = order?.items ?? [];
  const hasDigital = items.some((item) => DIGITAL_TYPES.has(item.itemType));
  const partnerItem = Boolean(order?.partnerId) || items.some((item) => Boolean(item.partnerId));
  const trackHref = `/dashboard/client/orders/${orderId}`;
  const accessHref = items.some((item) => item.itemType === "DIGITAL_AI")
    ? "/minha-conta/ia"
    : "/eccopet";

  const title = paid
    ? "Pedido confirmado"
    : failed
      ? "Pagamento recusado"
      : boletoIssued
        ? "Boleto emitido"
        : pixWaiting
          ? "Aguardando pagamento / Processando"
          : confirming
            ? "Aguardando confirmação"
            : "Pagamento pendente";

  return (
    <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <Card className="rounded-2xl border-[var(--ep-border)] shadow-sm">
        <CardContent className="space-y-4 p-6 text-center">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {paid && hasDigital && !partnerItem
              ? "Pagamento aprovado. Seu acesso EccoPet foi liberado."
              : paid && partnerItem
                ? "Pagamento aprovado. O parceiro recebeu o pedido e você já pode acompanhar o andamento."
                : paid
                  ? "Recebemos a confirmação do Mercado Pago."
                  : failed
                    ? `Pagamento recusado (${payment?.status || statusLabel}${
                        payment?.statusDetail ? ` · ${payment.statusDetail}` : ""
                      }). Você pode tentar novamente.`
                    : boletoIssued
                      ? "Boleto emitido. Status pendente até a compensação. Após o vencimento, o boleto fica inválido/expirado."
                      : pixWaiting
                        ? "Pix gerado. Aguardando pagamento / Processando. Se não for confirmado em 5 minutos, o status será recusado/expirado nesta tela."
                        : confirming
                          ? "Aguardando confirmação. Acompanhe o pedido — não pague de novo até ver o status final."
                          : "Conclua o pagamento online com cartão, Pix ou boleto."}
          </p>
          {order ? (
            <p className="text-sm">
              Pedido #{order.orderNumber} · R$ {Number(order.total).toFixed(2)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">ID: {orderId}</p>
          )}
          {confirming && order ? (
            <CheckoutPaymentPoller
              orderId={order.id}
              paymentId={payment?.id}
              deadlineMs={pixWaiting ? PIX_WAIT_MS : 72_000}
              awaitingLabel={
                pixWaiting ? "Aguardando pagamento / Processando" : "Aguardando confirmação"
              }
            />
          ) : null}
          {canRetry && user?.email ? (
            <CheckoutPayAgain
              orderId={orderId}
              amount={Number(order?.total ?? 0)}
              payerEmail={user.email}
            />
          ) : null}
          <div className="flex flex-wrap justify-center gap-3">
            {paid && hasDigital ? (
              <Button asChild>
                <Link href={accessHref}>Usar agora</Link>
              </Button>
            ) : null}
            {paid && partnerItem ? (
              <Button asChild>
                <Link href={trackHref}>Acompanhar pedido</Link>
              </Button>
            ) : null}
            {confirming || pixWaiting || boletoIssued ? (
              <Button asChild variant={paid ? "outline" : "default"}>
                <Link href={trackHref}>Acompanhar pedido</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/dashboard/client/orders">Meus pedidos</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/produtos">Continuar comprando</Link>
            </Button>
          </div>
          <CheckoutPolicies className="border-t border-[var(--ep-border)] pt-4 text-left" />
        </CardContent>
      </Card>
    </main>
  );
}
