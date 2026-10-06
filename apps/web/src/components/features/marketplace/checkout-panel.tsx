"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MercadoPagoCheckout } from "@/components/features/marketplace/mercado-pago-checkout";
import { AddressByCepField } from "@/components/shared/address/address-by-cep-field";
import { OrderEvents, PaymentEvents } from "@/lib/analytics/events";
import { analyticsService } from "@/lib/analytics/service";

type PaymentMethod = "PIX" | "CARD" | "BOLETO";

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  hint: string;
}[] = [
  { value: "CARD", label: "CARTÃO", hint: "Crédito online, tokenizado pelo Mercado Pago." },
  { value: "PIX", label: "PIX", hint: "Aprovação rápida." },
  { value: "BOLETO", label: "BOLETO", hint: "Pago na compensação bancária." },
];

type CheckoutGroup = {
  index: number;
  orderId: string;
  sellerName: string;
  amount: number;
  paymentStatus: string;
  status: string;
};

export function CheckoutPanel() {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [mpAvailable, setMpAvailable] = useState<boolean | null>(null);
  const [mpConfigMessage, setMpConfigMessage] = useState("");
  const [pendingOrder, setPendingOrder] = useState<{
    id: string;
    total: number;
  } | null>(null);
  const [groups, setGroups] = useState<CheckoutGroup[]>([]);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [payerEmail, setPayerEmail] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const pendingRef = useRef<{ id: string; total: number } | null>(null);
  const [form, setForm] = useState({
    paymentMethod: "CARD" as PaymentMethod,
    phone: "",
    notes: "",
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
    zipCode: "",
    district: "",
  });

  useEffect(() => {
    fetch("/api/cart", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCart(d.data.cart);
      });
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const email = d?.data?.user?.email ?? d?.user?.email;
        if (typeof email === "string") setPayerEmail(email);
      })
      .catch(() => undefined);
    fetch("/api/checkout/mercado-pago/config", { credentials: "include" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.success && d.data?.publicKey) {
          setMpAvailable(true);
          setMpConfigMessage("");
        } else {
          setMpAvailable(false);
          setMpConfigMessage(
            d.error?.message ?? "Não foi possível carregar a configuração do Mercado Pago."
          );
        }
      })
      .catch(() => {
        setMpAvailable(false);
        setMpConfigMessage("Não foi possível carregar a configuração do Mercado Pago.");
      });
  }, []);

  const ensureOrder = useCallback(async () => {
    if (pendingOrder) return pendingOrder;
    if (!payerEmail.trim()) {
      throw new Error("Faça login com um e-mail válido para pagar online.");
    }
    setSaving(true);
    setError("");
    setFieldErrors({});
    analyticsService.track(OrderEvents.BEGIN_CHECKOUT, {
      params: { payment_method: form.paymentMethod, delivery_method: "DELIVERY_LOCAL" },
    });
    const res = await fetch("/api/checkout", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        deliveryMethod: "DELIVERY_LOCAL",
        paymentMethod: form.paymentMethod,
        phone: form.phone,
        notes: form.notes || null,
        address: {
          street: form.street,
          number: form.number || undefined,
          complement: form.complement || undefined,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode || undefined,
          district: form.district || undefined,
        },
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.success) {
      const fields = (data.error?.fields ?? {}) as Record<string, string>;
      setFieldErrors(fields);
      throw new Error(data.error?.message ?? "Erro ao finalizar pedido.");
    }
    setIdempotencyKey(crypto.randomUUID());
    const sessionGroups = (data.data.groups ?? []) as CheckoutGroup[];
    setGroups(sessionGroups);
    setSessionNotice(typeof data.data.notice === "string" ? data.data.notice : null);
    setHasSubscription(Boolean(data.data.hasSubscription));
    const order = data.data.order as { id: string; total: number };
    const nextPending =
      sessionGroups.find((g) => g.paymentStatus !== "APPROVED" && g.status !== "PAID") ?? sessionGroups[0];
    const next = nextPending
      ? { id: nextPending.orderId, total: Number(nextPending.amount) }
      : { id: order.id, total: Number(order.total) };
    analyticsService.track(OrderEvents.ORDER_COMPLETE, {
      value: next.total,
      params: { order_id: next.id, pay_mode: "online" },
    });
    analyticsService.track(PaymentEvents.PAYMENT_START, {
      value: next.total,
      params: { order_id: next.id, provider: "mercado_pago" },
    });
    setPendingOrder(next);
    pendingRef.current = next;
    return next;
  }, [form, idempotencyKey, payerEmail, pendingOrder]);

  if (!cart) return <p className="text-sm">Carregando...</p>;
  const items = (cart.items as Record<string, unknown>[]) ?? [];
  if (items.length === 0 && !pendingOrder) {
    return (
      <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Carrinho vazio.{" "}
        <Link href="/produtos" className="underline">
          Ver produtos
        </Link>
      </p>
    );
  }
  if (Boolean(cart.blockedCount) && Number(cart.blockedCount) > 0) {
    return (
      <p className="text-sm text-red-600">
        Há itens no carrinho que precisam de correção antes do pagamento.{" "}
        <Link href="/carrinho" className="underline">
          Voltar ao carrinho
        </Link>
      </p>
    );
  }

  const subtotal = Number(cart.subtotal);
  const shipping = cart.shipping == null ? null : Number(cart.shipping);
  const discount = Number(cart.discount ?? 0);
  const total = pendingOrder?.total ?? subtotal - (Number.isFinite(discount) ? discount : 0) + (shipping ?? 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-lg font-semibold">Resumo do pedido</h2>
          {Boolean(cart.hasSubscription) || hasSubscription ? (
            <p className="text-sm text-muted-foreground">Esta compra inclui uma assinatura recorrente.</p>
          ) : null}
          {sessionNotice ? <p className="text-sm text-muted-foreground">{sessionNotice}</p> : null}
          {groups.length > 1 ? (
            <p className="text-sm font-medium">
              Pagamento {groups.filter((g) => g.paymentStatus === "APPROVED" || g.status === "PAID").length + 1} de {groups.length}
            </p>
          ) : null}
          {groups.filter((g) => g.paymentStatus === "APPROVED" || g.status === "PAID").length > 0 &&
          groups.some((g) => g.paymentStatus !== "APPROVED" && g.status !== "PAID") ? (
            <p className="text-sm">
              {groups.filter((g) => g.paymentStatus === "APPROVED" || g.status === "PAID").length} pagamento concluído.
              {" "}
              {groups.filter((g) => g.paymentStatus !== "APPROVED" && g.status !== "PAID").length} pagamentos ainda precisam ser finalizados.
            </p>
          ) : null}
          {items.map((item) => (
            <p key={String(item.id)} className="flex justify-between gap-3 text-sm">
              <span>
                {String(item.name)} · {Number(item.quantity)}x
              </span>
              <span>R$ {(Number(item.unitPrice) * Number(item.quantity)).toFixed(2)}</span>
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-lg font-semibold">Dados de entrega</h2>
          <div>
            <label htmlFor="checkout-phone" className="mb-1 block text-sm font-medium">
              Telefone
            </label>
            <Input
              id="checkout-phone"
              type="tel"
              placeholder="Ex.: (11) 99999-9999"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              aria-invalid={fieldErrors.phone ? true : undefined}
              aria-describedby={fieldErrors.phone ? "checkout-phone-error" : undefined}
              className={fieldErrors.phone ? "border-red-500" : undefined}
            />
            {fieldErrors.phone ? (
              <p id="checkout-phone-error" className="mt-1 text-xs text-red-500">
                {fieldErrors.phone}
              </p>
            ) : null}
          </div>
          <AddressByCepField
            idPrefix="checkout"
            title=""
            variant="plain"
            showReference={false}
            value={{
              zipCode: form.zipCode,
              street: form.street,
              number: form.number,
              district: form.district ?? "",
              city: form.city,
              state: form.state,
              complement: form.complement,
            }}
            onChange={(address) =>
              setForm((current) => ({
                ...current,
                zipCode: address.zipCode,
                street: address.street,
                number: address.number,
                district: address.district,
                city: address.city,
                state: address.state,
                complement: address.complement ?? "",
              }))
            }
            errors={fieldErrors}
          />
          <div>
            <label htmlFor="checkout-notes" className="mb-1 block text-sm font-medium">
              Observações
            </label>
            <textarea
              id="checkout-notes"
              className="w-full rounded border px-3 py-2 text-sm"
              rows={2}
              placeholder="Ponto de referência, horário preferido..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-lg font-semibold">Pagamento online</h2>
          {mpAvailable === false ? (
            <p
              className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200"
              role="alert"
            >
              {mpConfigMessage || "Configuração do Mercado Pago indisponível neste momento."}
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {PAYMENT_METHODS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`rounded-2xl border-2 px-4 py-6 text-center transition ${
                      form.paymentMethod === opt.value
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "hover:border-primary/40"
                    }`}
                    onClick={() => setForm({ ...form, paymentMethod: opt.value })}
                  >
                    <span className="block text-base font-bold tracking-wide">{opt.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{opt.hint}</span>
                  </button>
                ))}
              </div>
              <MercadoPagoCheckout
                key={pendingOrder?.id ?? "checkout"}
                amount={total}
                payerEmail={payerEmail}
                initialMethod={
                  form.paymentMethod === "PIX"
                    ? "pix"
                    : form.paymentMethod === "BOLETO"
                      ? "boleto"
                      : "card"
                }
                methodLocked
                ensureOrder={ensureOrder}
                onPaid={async (result) => {
                  const order = pendingRef.current;
                  if (!order) return;
                  const approved = String(result.status).toUpperCase() === "APPROVED";
                  if (approved) {
                    analyticsService.track(PaymentEvents.PAYMENT_APPROVED, {
                      value: order.total,
                      params: { order_id: order.id, status: result.status, provider: "mercado_pago" },
                    });
                    const updated = groups.map((g) =>
                      g.orderId === order.id ? { ...g, paymentStatus: "APPROVED", status: "PAID" } : g
                    );
                    setGroups(updated);
                    const nextGroup = updated.find((g) => g.paymentStatus !== "APPROVED" && g.status !== "PAID");
                    if (nextGroup) {
                      const next = { id: nextGroup.orderId, total: Number(nextGroup.amount) };
                      setPendingOrder(next);
                      pendingRef.current = next;
                      return;
                    }
                  }
                  router.push(
                    `/checkout/sucesso/${order.id}?payment=${result.paymentId}&status=${result.status}`
                  );
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-5">
          <h2 className="text-lg font-semibold">Resumo financeiro</h2>
          <p className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </p>
          {shipping != null && Number.isFinite(shipping) ? (
            <p className="flex justify-between text-sm">
              <span>Frete</span>
              <span>R$ {shipping.toFixed(2)}</span>
            </p>
          ) : null}
          {discount > 0 ? (
            <p className="flex justify-between text-sm">
              <span>Descontos</span>
              <span>- R$ {discount.toFixed(2)}</span>
            </p>
          ) : null}
          <p className="flex justify-between font-semibold">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Frete, desconto e total são recalculados no servidor. O pedido só fica pago após
            confirmação do Mercado Pago.
          </p>
          {saving ? <p className="text-xs text-muted-foreground">Preparando pedido…</p> : null}
          {error ? (
            <p id="checkout-error" className="text-sm text-red-600" role="alert" aria-live="polite">
              {error}
            </p>
          ) : null}
          <Button asChild variant="ghost" className="px-0">
            <Link href="/carrinho">Voltar ao carrinho</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
