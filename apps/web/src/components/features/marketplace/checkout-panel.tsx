"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Barcode, CreditCard, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MercadoPagoCheckout } from "@/components/features/marketplace/mercado-pago-checkout";
import { CartItem } from "@/components/features/marketplace/cart-item";
import { AddressByCepField } from "@/components/shared/address/address-by-cep-field";
import { OrderEvents, PaymentEvents } from "@/lib/analytics/events";
import { analyticsService } from "@/lib/analytics/service";
import { formatMpPrice } from "@/lib/marketplace/config";
import { useServerCart } from "@/hooks/use-server-cart";
import { useTranslation } from "@/providers/i18n-provider";
import {
  clearServerCart,
  removeServerCartItem,
  updateServerCartItem,
  type ServerCartItem,
} from "@/lib/marketplace/cart-client";
import { cn } from "@/lib/utils";

type PaymentMethod = "PIX" | "CARD" | "BOLETO";

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  hint: string;
  icon: typeof CreditCard;
}[] = [
  { value: "CARD", label: "CARTÃO", hint: "Crédito online, tokenizado pelo Mercado Pago.", icon: CreditCard },
  { value: "PIX", label: "PIX", hint: "Aprovação rápida.", icon: QrCode },
  { value: "BOLETO", label: "BOLETO", hint: "Pago na compensação bancária.", icon: Barcode },
];

type CheckoutGroup = {
  index: number;
  orderId: string;
  sellerName: string;
  amount: number;
  paymentStatus: string;
  status: string;
};

function isGroupPaid(group: CheckoutGroup) {
  return group.paymentStatus === "APPROVED" || group.status === "PAID";
}

export function CheckoutPanel() {
  const router = useRouter();
  const { t } = useTranslation();
  const { cart, setCart, loading } = useServerCart();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [mpAvailable, setMpAvailable] = useState<boolean | null>(null);
  const [mpConfigMessage, setMpConfigMessage] = useState("");
  const [pendingOrder, setPendingOrder] = useState<{
    id: string;
    total: number;
  } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [groups, setGroups] = useState<CheckoutGroup[]>([]);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [payerEmail, setPayerEmail] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const pendingRef = useRef<{ id: string; total: number } | null>(null);
  const paymentRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const resetUnpaidSnapshot = useCallback(async () => {
    if (sessionId) {
      await fetch(`/api/checkout/session/${sessionId}`, { method: "DELETE", credentials: "include" }).catch(
        () => undefined
      );
    }
    setPendingOrder(null);
    pendingRef.current = null;
    setGroups([]);
    setSessionId(null);
    setSessionNotice(null);
    setIdempotencyKey(crypto.randomUUID());
  }, [sessionId]);

  const checkoutLocked = groups.some(isGroupPaid);

  async function changeQty(item: ServerCartItem, quantity: number) {
    if (!item.quantityApplies || checkoutLocked) return;
    setError("");
    setBusyId(item.id);
    try {
      const next = await updateServerCartItem(item.id, quantity);
      setCart(next);
      await resetUnpaidSnapshot();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível atualizar a quantidade.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(item: ServerCartItem) {
    if (checkoutLocked) return;
    setError("");
    setBusyId(item.id);
    try {
      const next = await removeServerCartItem(item.id);
      setCart(next);
      await resetUnpaidSnapshot();
      setToast("Item removido.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível remover o item.");
    } finally {
      setBusyId(null);
    }
  }

  async function clearAll() {
    setClearing(true);
    setError("");
    try {
      const next = await clearServerCart();
      setCart(next);
      await resetUnpaidSnapshot();
      setClearOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("cart.clearFailed"));
    } finally {
      setClearing(false);
    }
  }

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
      throw new Error(data.error?.message ?? "Não foi possível criar o pedido. Tente novamente.");
    }
    setIdempotencyKey(crypto.randomUUID());
    const sessionGroups = (data.data.groups ?? []) as CheckoutGroup[];
    setGroups(sessionGroups);
    setSessionId(typeof data.data.sessionId === "string" ? data.data.sessionId : null);
    setSessionNotice(typeof data.data.notice === "string" ? data.data.notice : null);
    setHasSubscription(Boolean(data.data.hasSubscription));
    const order = data.data.order as { id: string; total: number };
    const nextPending =
      sessionGroups.find((g) => !isGroupPaid(g)) ?? sessionGroups[0];
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

  const items = cart?.items ?? [];
  const sellerGroups = cart?.groups?.length
    ? cart.groups
    : [{ sellerId: "all", sellerName: "", sellerType: "ECCOPET" as const, items, subtotal: 0 }];

  const checkoutGrandTotal = Number(cart?.summary?.oneTimeTotal ?? cart?.subtotal ?? 0);
  const discount = Number(cart?.discount ?? cart?.summary?.discounts ?? 0);
  const shipping = cart?.shipping == null ? null : Number(cart.shipping);
  const recurringTotal = Number(cart?.recurringMonthly ?? cart?.summary?.recurringMonthly ?? 0);
  const activeDraft = useMemo(() => {
    const drafts = cart?.paymentGroups ?? [];
    return drafts[0] ?? null;
  }, [cart?.paymentGroups]);
  const paymentGroupTotal = pendingOrder?.total ?? Number(activeDraft?.grossAmount ?? checkoutGrandTotal);
  const paidGroups = groups.filter(isGroupPaid);
  const pendingGroups = groups.filter((g) => !isGroupPaid(g));
  const currentGroupIndex = pendingGroups[0]?.index ?? paidGroups.length;

  if (loading && !cart) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    );
  }

  if (!cart || (items.length === 0 && !pendingOrder)) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--ep-border)] px-4 py-8 text-center text-sm text-muted-foreground">
        Carrinho vazio.{" "}
        <Link href="/produtos" className="underline">
          Ver produtos
        </Link>
      </p>
    );
  }

  if (Boolean(cart.blockedCount) && Number(cart.blockedCount) > 0 && !pendingOrder) {
    return (
      <p className="text-sm text-red-600">
        Há itens no carrinho que precisam de correção antes do pagamento.{" "}
        <Link href="/carrinho" className="underline">
          Voltar ao carrinho
        </Link>
      </p>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl pb-28 lg:pb-8">
      {toast ? (
        <p className="mb-4 rounded-xl border border-[var(--ep-border)] bg-[var(--card)] px-4 py-2 text-sm" role="status">
          {toast}
        </p>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card className="rounded-2xl border-[var(--ep-border)] shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Seu pedido</h2>
                  <p className="sr-only">Resumo do pedido</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/carrinho">Editar carrinho</Link>
                  </Button>
                  {items.length > 0 && !checkoutLocked ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setClearOpen(true)}>
                      Limpar carrinho
                    </Button>
                  ) : null}
                </div>
              </div>
              {Boolean(cart.hasSubscription) || hasSubscription ? (
                <p className="text-sm text-muted-foreground">Esta compra inclui uma assinatura recorrente.</p>
              ) : null}
              {sessionNotice ? <p className="text-sm text-muted-foreground">{sessionNotice}</p> : null}
              {groups.length > 1 ? (
                <p className="text-sm font-medium">
                  Pagamento {Math.min(currentGroupIndex + 1, groups.length)} de {groups.length}
                </p>
              ) : null}
              {paidGroups.length > 0 && pendingGroups.length > 0 ? (
                <div className="space-y-1 rounded-xl border border-[var(--ep-border)] bg-[var(--surface-muted)] px-3 py-2 text-sm">
                  <p>
                    Pagamento concluído:{" "}
                    {paidGroups.map((g) => `${g.sellerName} — ${formatMpPrice(g.amount)}`).join(" · ")}
                  </p>
                  <p>
                    Pendente:{" "}
                    {pendingGroups.map((g) => `${g.sellerName} — ${formatMpPrice(g.amount)}`).join(" · ")}
                  </p>
                </div>
              ) : null}
              <div className="max-h-[min(70vh,40rem)] space-y-5 overflow-y-auto pr-1">
                {sellerGroups.map((group) => (
                  <section key={group.sellerId} className="space-y-3">
                    {group.sellerName ? (
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--ep-fg-muted)]">
                        {group.sellerName}
                      </h3>
                    ) : null}
                    {group.items.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        busy={busyId === item.id}
                        onQuantity={(qty) => void changeQty(item, qty)}
                        onRemove={() => void removeItem(item)}
                      />
                    ))}
                  </section>
                ))}
              </div>
            </CardContent>
          </Card>

          {items.length > 0 ? (
            <>
              <Card className="rounded-2xl border-[var(--ep-border)] shadow-sm">
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
                      className="w-full rounded-xl border border-[var(--ep-border)] bg-transparent px-3 py-2 text-sm"
                      rows={2}
                      placeholder="Ponto de referência, horário preferido..."
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <div ref={paymentRef}>
              <Card className="rounded-2xl border-[var(--ep-border)] shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <h2 className="text-lg font-semibold">Pagamento online</h2>
                  {groups.length > 1 ? (
                    <p className="text-sm text-muted-foreground">
                      Pagamento {Math.min(currentGroupIndex + 1, groups.length)} de {groups.length}
                      {pendingGroups[0] ? ` · ${pendingGroups[0].sellerName} — ${formatMpPrice(pendingGroups[0].amount)}` : ""}
                    </p>
                  ) : null}
                  {paidGroups.length > 0 && pendingGroups.length > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => paymentRef.current?.scrollIntoView({ behavior: "smooth" })}
                    >
                      Continuar pagamentos pendentes
                    </Button>
                  ) : null}
                  {mpAvailable === false ? (
                    <p
                      className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200"
                      role="alert"
                    >
                      {mpConfigMessage || "Configuração do Mercado Pago indisponível neste momento."}
                    </p>
                  ) : (
                    <>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {PAYMENT_METHODS.map((opt) => {
                          const Icon = opt.icon;
                          const selected = form.paymentMethod === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={cn(
                                "rounded-2xl border-2 px-4 py-6 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                selected
                                  ? "border-primary bg-primary/5 shadow-sm"
                                  : "hover:border-primary/40"
                              )}
                              onClick={() => setForm({ ...form, paymentMethod: opt.value })}
                              aria-pressed={selected}
                            >
                              <Icon className="mx-auto mb-2 h-5 w-5" aria-hidden />
                              <span className="block text-base font-bold tracking-wide">{opt.label}</span>
                              <span className="mt-1 block text-xs text-muted-foreground">{opt.hint}</span>
                            </button>
                          );
                        })}
                      </div>
                      <MercadoPagoCheckout
                        key={pendingOrder?.id ?? "checkout"}
                        amount={paymentGroupTotal}
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
                            const nextGroup = updated.find((g) => !isGroupPaid(g));
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
              </div>
            </>
          ) : null}
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-24">
          <CheckoutFinanceSummary
            checkoutGrandTotal={checkoutGrandTotal}
            discount={discount}
            shipping={shipping}
            recurringTotal={recurringTotal}
            paymentGroupTotal={paymentGroupTotal}
            hasSubscription={hasSubscription || Boolean(cart.hasSubscription)}
            showGroupAmount={groups.length > 1 && Boolean(pendingOrder)}
            saving={saving}
            error={error}
          />
        </aside>
      </div>

      <div className="mt-6 lg:hidden">
        <CheckoutFinanceSummary
          checkoutGrandTotal={checkoutGrandTotal}
          discount={discount}
          shipping={shipping}
          recurringTotal={recurringTotal}
          paymentGroupTotal={paymentGroupTotal}
          hasSubscription={hasSubscription || Boolean(cart.hasSubscription)}
          showGroupAmount={groups.length > 1 && Boolean(pendingOrder)}
          saving={saving}
          error={error}
        />
      </div>

      {items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--ep-border)] bg-[var(--card)]/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">TOTAL</p>
              <p className="text-base font-semibold">{formatMpPrice(checkoutGrandTotal + (shipping ?? 0))}</p>
            </div>
            <Button
              type="button"
              onClick={() => paymentRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Continuar pagamento
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deseja remover todos os itens do carrinho?</DialogTitle>
            <DialogDescription>{t("cart.clearConfirmBody")}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setClearOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" disabled={clearing} onClick={() => void clearAll()}>
              Limpar carrinho
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CheckoutFinanceSummary(props: {
  checkoutGrandTotal: number;
  discount: number;
  shipping: number | null;
  recurringTotal: number;
  paymentGroupTotal: number;
  hasSubscription: boolean;
  showGroupAmount: boolean;
  saving: boolean;
  error: string;
}) {
  const payToday = props.checkoutGrandTotal + (props.shipping ?? 0);
  return (
    <Card className="rounded-2xl border-[var(--ep-border)] shadow-sm">
      <CardContent className="space-y-3 p-5">
        <h2 className="text-lg font-semibold">Resumo financeiro</h2>
        <p className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatMpPrice(props.checkoutGrandTotal + (Number.isFinite(props.discount) ? props.discount : 0))}</span>
        </p>
        {props.discount > 0 ? (
          <p className="flex justify-between text-sm text-eccopet-green">
            <span>Descontos</span>
            <span>- {formatMpPrice(props.discount)}</span>
          </p>
        ) : null}
        {props.shipping != null && Number.isFinite(props.shipping) ? (
          <p className="flex justify-between text-sm">
            <span>Frete</span>
            <span>{formatMpPrice(props.shipping)}</span>
          </p>
        ) : null}
        <p className="flex justify-between text-sm">
          <span>Pagamento hoje</span>
          <span>{formatMpPrice(payToday)}</span>
        </p>
        {props.hasSubscription ? (
          <p className="flex justify-between text-sm text-muted-foreground">
            <span>Cobrança mensal/anual recorrente</span>
            <span>{formatMpPrice(props.recurringTotal)}</span>
          </p>
        ) : null}
        <p className="flex justify-between border-t border-[var(--ep-border)] pt-3 font-semibold">
          <span>Total geral</span>
          <span className="text-eccopet-green">{formatMpPrice(payToday)}</span>
        </p>
        {props.showGroupAmount ? (
          <p className="flex justify-between text-sm">
            <span>Este pagamento</span>
            <span>{formatMpPrice(props.paymentGroupTotal)}</span>
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Frete, desconto e total são recalculados no servidor. O pedido só fica pago após
          confirmação do Mercado Pago.
        </p>
        <p className="text-xs text-muted-foreground">
          Pagamento processado com segurança pelo Mercado Pago.
        </p>
        {props.saving ? <p className="text-xs text-muted-foreground">Preparando pedido…</p> : null}
        {props.error ? (
          <p id="checkout-error" className="text-sm text-red-600" role="alert" aria-live="polite">
            {props.error}
          </p>
        ) : null}
        <Button asChild variant="ghost" className="px-0">
          <Link href="/carrinho">Voltar ao carrinho</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
