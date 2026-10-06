"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { CheckoutPaymentPoller } from "@/components/features/marketplace/checkout-payment-poller";

type MpConfig = {
  publicKey: string;
  environment: string;
  status: string;
};

type PayResult = {
  paymentId: string;
  providerOrderId: string;
  status: string;
  statusDetail: string | null;
  mpOrder: {
    ticketUrl?: string | null;
    qrCode?: string | null;
    qrCodeBase64?: string | null;
    barcode?: string | null;
    digitableLine?: string | null;
    expiration?: string | null;
  } | null;
};

type Props = {
  orderId?: string;
  amount: number;
  payerEmail: string;
  initialMethod?: "card" | "pix" | "boleto";
  methodLocked?: boolean;
  ensureOrder?: () => Promise<{ id: string; total: number }>;
  onPaid: (result: PayResult) => void;
  onCancel?: () => void;
};

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale?: string }
    ) => {
      createCardToken: (data: Record<string, string | number>) => Promise<{ id: string }>;
      getPaymentMethods: (opts: { bin: string }) => Promise<{
        results?: Array<{ id: string; payment_type_id?: string }>;
      }>;
    };
  }
}

function loadMpSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.MercadoPago) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-mp-sdk="v2"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("SDK_LOAD_FAILED")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.dataset.mpSdk = "v2";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("SDK_LOAD_FAILED"));
    document.body.appendChild(script);
  });
}

function mapCardPayError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("bin") || text.includes("card") || text.includes("token") || text.includes("cvv") || text.includes("invalid")) {
    return "Dados do cartão inválidos.";
  }
  if (text.includes("recus") || text.includes("rejected") || text.includes("issuer")) {
    return "Pagamento recusado pelo emissor.";
  }
  if (text.includes("não foi criado") || text.includes("not created") || text.includes("mp_")) {
    return "O pagamento não foi criado. Nenhuma cobrança foi realizada.";
  }
  return message || "O pagamento não foi criado. Nenhuma cobrança foi realizada.";
}

/**
 * Checkout Transparente — tokenização no browser (Public Key).
 * Nunca envia PAN/CVV ao backend EcoPet; apenas cardToken.
 */
export function MercadoPagoCheckout({
  orderId: orderIdProp,
  amount,
  payerEmail,
  initialMethod = "card",
  methodLocked = false,
  ensureOrder,
  onPaid,
  onCancel,
}: Props) {
  const [config, setConfig] = useState<MpConfig | null>(null);
  const [method, setMethod] = useState<"card" | "pix" | "boleto">(initialMethod);
  const [orderId, setOrderId] = useState(orderIdProp ?? "");
  const [enabledMethods, setEnabledMethods] = useState<Array<"card" | "pix" | "boleto">>([
    "card",
    "pix",
    "boleto",
  ]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PayResult | null>(null);
  const submitLock = useRef(false);
  const [installmentOptions, setInstallmentOptions] = useState<
    Array<{
      installments: number;
      installmentAmount: number;
      totalAmount: number;
      recommendedMessage: string;
    }>
  >([]);

  const [card, setCard] = useState({
    cardNumber: "",
    cardholderName: "",
    cardExpirationMonth: "",
    cardExpirationYear: "",
    securityCode: "",
    identificationType: "CPF",
    identificationNumber: "",
    installments: 1,
  });
  const [boleto, setBoleto] = useState({
    firstName: "",
    lastName: "",
    identificationNumber: "",
    zipCode: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/checkout/mercado-pago/config", { credentials: "include" });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message ?? "Configuração indisponível");
        }
        await loadMpSdk();
        const methodsRes = await fetch("/api/checkout/mercado-pago/payment-methods", {
          credentials: "include",
        });
        const methodsJson = await methodsRes.json();
        if (!cancelled && methodsRes.ok && methodsJson.success) {
          const ids = (methodsJson.data.methods as Array<{ methodId: string }>).map((m) => m.methodId);
          const next: Array<"card" | "pix" | "boleto"> = [];
          if (ids.includes("credit_card") || ids.includes("debit_card")) next.push("card");
          if (ids.includes("pix")) next.push("pix");
          if (ids.includes("boleto")) next.push("boleto");
          if (next.length) {
            setEnabledMethods(next);
            if (!methodLocked) setMethod(next[0]);
          }
        }
        if (!cancelled) {
          setConfig(json.data);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Falha ao carregar Mercado Pago");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [methodLocked]);

  useEffect(() => {
    setMethod(initialMethod);
  }, [initialMethod]);

  useEffect(() => {
    if (orderIdProp) setOrderId(orderIdProp);
  }, [orderIdProp]);

  const resolveOrderId = useCallback(async () => {
    if (orderId) return orderId;
    if (!ensureOrder) throw new Error("Pedido indisponível para pagamento.");
    const created = await ensureOrder();
    setOrderId(created.id);
    return created.id;
  }, [ensureOrder, orderId]);

  useEffect(() => {
    const digits = card.cardNumber.replace(/\D/g, "");
    if (method !== "card" || digits.length < 6 || !(amount > 0)) {
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/checkout/mercado-pago/installments", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...(orderId ? { orderId } : {}),
              bin: digits.slice(0, 8),
              amount,
            }),
          });
          const json = await res.json();
          if (res.ok && json.success) {
            setInstallmentOptions(json.data.options ?? []);
            setError((current) =>
              current === "Não foi possível calcular as parcelas." ? "" : current
            );
          } else if (res.status !== 400) {
            setError("Não foi possível calcular as parcelas.");
          }
        } catch {
          setError("Não foi possível calcular as parcelas.");
        }
      })();
    }, 500);
    return () => clearTimeout(t);
  }, [card.cardNumber, method, orderId, amount]);

  const payOnline = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch("/api/checkout/mercado-pago/order", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? "Falha no pagamento");
      }
      return json.data as PayResult;
    },
    []
  );

  async function handleCardPay(e: React.FormEvent) {
    e.preventDefault();
    if (submitLock.current || submitting || !config) return;
    submitLock.current = true;
    setSubmitting(true);
    setError("");
    try {
      if (!window.MercadoPago) throw new Error("SDK Mercado Pago não carregado");
      const mp = new window.MercadoPago(config.publicKey, { locale: "pt-BR" });
      const bin = card.cardNumber.replace(/\D/g, "").slice(0, 6);
      const methods = await mp.getPaymentMethods({ bin });
      const pm = methods.results?.[0];
      if (!pm?.id) throw new Error("Bandeira do cartão não identificada");

      const token = await mp.createCardToken({
        cardNumber: card.cardNumber.replace(/\D/g, ""),
        cardholderName: card.cardholderName,
        cardExpirationMonth: card.cardExpirationMonth,
        cardExpirationYear: card.cardExpirationYear.length === 2
          ? `20${card.cardExpirationYear}`
          : card.cardExpirationYear,
        securityCode: card.securityCode,
        identificationType: card.identificationType,
        identificationNumber: card.identificationNumber.replace(/\D/g, ""),
      });

      const liveOrderId = await resolveOrderId();
      const paid = await payOnline({
        orderId: liveOrderId,
        paymentMethodId: pm.id,
        paymentMethodType: pm.payment_type_id?.includes("debit") ? "debit_card" : "credit_card",
        cardToken: token.id,
        installments: card.installments,
        payerEmail,
        identificationType: card.identificationType,
        identificationNumber: card.identificationNumber.replace(/\D/g, ""),
      });

      setResult(paid);
      const status = String(paid.status).toUpperCase();
      if (["REJECTED", "CANCELLED", "EXPIRED", "ERROR"].includes(status)) {
        setError("Pagamento recusado pelo emissor.");
        return;
      }
      onPaid(paid);
    } catch (err) {
      setError(err instanceof Error ? mapCardPayError(err.message) : "Dados do cartão inválidos.");
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  }

  async function handleAltPay(alt: "pix" | "boleto") {
    if (submitLock.current || submitting) return;
    submitLock.current = true;
    setSubmitting(true);
    setError("");
    try {
      if (alt === "boleto") {
        if (!boleto.firstName.trim() || !boleto.lastName.trim() || boleto.identificationNumber.replace(/\D/g, "").length < 11) {
          throw new Error("Informe nome, sobrenome e CPF do pagador para emitir o boleto.");
        }
      }
      const liveOrderId = await resolveOrderId();
      const paid = await payOnline({
        orderId: liveOrderId,
        paymentMethodId: alt,
        payerEmail,
        ...(alt === "boleto"
          ? {
              payerFirstName: boleto.firstName.trim(),
              payerLastName: boleto.lastName.trim(),
              identificationType: "CPF",
              identificationNumber: boleto.identificationNumber.replace(/\D/g, ""),
            }
          : {}),
      });
      setResult(paid);
      const status = String(paid.status).toUpperCase();
      if (["REJECTED", "CANCELLED", "EXPIRED", "ERROR"].includes(status)) {
        setError("O pagamento não foi criado. Nenhuma cobrança foi realizada.");
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar pagamento");
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        Carregando checkout seguro…
      </p>
    );
  }

  if (!config) {
    return (
      <div role="alert" className="space-y-2 text-sm text-red-600">
        <p>{error || "Checkout online indisponível."}</p>
        {onCancel ? (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Voltar
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border p-4" aria-label="Checkout Mercado Pago">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">
            {method === "pix"
              ? "Pix — aprovação rápida"
              : method === "boleto"
                ? "Boleto bancário"
                : "Cartão de crédito"}
          </p>
          <p className="text-xs text-muted-foreground">
            Mercado Pago · R$ {amount.toFixed(2)}
          </p>
        </div>
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        ) : null}
      </div>

      {!methodLocked ? (
      <div className="flex gap-2" role="tablist" aria-label="Método de pagamento online">
        {(
          [
            ["card", "Cartão"],
            ["pix", "PIX"],
            ["boleto", "Boleto"],
          ] as const
        )
          .filter(([id]) => enabledMethods.includes(id))
          .map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={method === id}
              className={`rounded border px-3 py-1.5 text-sm ${
                method === id ? "border-primary bg-primary/5 font-medium" : ""
              }`}
              onClick={() => setMethod(id)}
              disabled={submitting}
            >
              {label}
            </button>
          ))}
      </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="space-y-2 rounded border border-dashed p-3 text-sm" role="status">
          <p>
            {result.mpOrder?.qrCode
              ? "Aguardando pagamento"
              : result.mpOrder?.ticketUrl || result.mpOrder?.digitableLine
                ? "Aguardando compensação"
                : "Pagamento pendente"}
            {": "}
            <strong>{result.status}</strong>
            {result.statusDetail ? ` (${result.statusDetail})` : ""}
          </p>
          {result.mpOrder?.expiration ? (
            <p className="text-xs text-muted-foreground">
              Expiração: {new Date(result.mpOrder.expiration).toLocaleString("pt-BR")}
            </p>
          ) : result.mpOrder?.qrCode ? (
            <p className="text-xs text-muted-foreground">Expiração: 24 horas após a geração.</p>
          ) : null}
          {result.mpOrder?.qrCodeBase64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:image/png;base64,${result.mpOrder.qrCodeBase64}`}
              alt="QR Code PIX"
              className="h-40 w-40"
            />
          ) : null}
          {result.mpOrder?.qrCode ? (
            <div className="space-y-2">
              <p className="break-all font-mono text-xs">Pix copia-e-cola: {result.mpOrder.qrCode}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void navigator.clipboard.writeText(result.mpOrder?.qrCode || "")}
              >
                Copiar código Pix
              </Button>
              <p className="text-xs text-muted-foreground">
                Aguardando pagamento. O pedido só será marcado como pago após confirmação do Mercado Pago.
              </p>
              {orderId ? <CheckoutPaymentPoller orderId={orderId} paymentId={result.paymentId} /> : null}
            </div>
          ) : null}
          {result.mpOrder?.digitableLine ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Linha digitável</p>
              <p className="break-all font-mono text-xs">{result.mpOrder.digitableLine}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void navigator.clipboard.writeText(result.mpOrder?.digitableLine || "")}
              >
                Copiar linha digitável
              </Button>
            </div>
          ) : null}
          {result.mpOrder?.barcode && result.mpOrder.barcode !== result.mpOrder.digitableLine ? (
            <p className="break-all font-mono text-xs">Código de barras: {result.mpOrder.barcode}</p>
          ) : null}
          {result.mpOrder?.ticketUrl ? (
            <div className="flex flex-wrap gap-3">
              <a
                href={result.mpOrder.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block underline"
              >
                Abrir boleto
              </a>
              <a
                href={result.mpOrder.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-block underline"
              >
                Baixar boleto
              </a>
            </div>
          ) : null}
          {(result.mpOrder?.ticketUrl || result.mpOrder?.digitableLine) && orderId ? (
            <CheckoutPaymentPoller orderId={orderId} paymentId={result.paymentId} />
          ) : null}
          <Button type="button" className="w-full" onClick={() => onPaid(result)}>
            Continuar
          </Button>
        </div>
      ) : null}

      {method === "card" && !result ? (
        <form onSubmit={handleCardPay} className="space-y-3" noValidate>
          <div>
            <label htmlFor="mp-card-number" className="mb-1 block text-sm font-medium">
              Número do cartão
            </label>
            <Input
              id="mp-card-number"
              inputMode="numeric"
              autoComplete="cc-number"
              value={card.cardNumber}
              onChange={(e) => setCard({ ...card, cardNumber: e.target.value })}
              required
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="mp-card-name" className="mb-1 block text-sm font-medium">
              Nome no cartão
            </label>
            <Input
              id="mp-card-name"
              autoComplete="cc-name"
              value={card.cardholderName}
              onChange={(e) => setCard({ ...card, cardholderName: e.target.value })}
              required
              disabled={submitting}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="mp-exp-m" className="mb-1 block text-sm font-medium">
                Mês
              </label>
              <Input
                id="mp-exp-m"
                inputMode="numeric"
                autoComplete="cc-exp-month"
                placeholder="MM"
                value={card.cardExpirationMonth}
                onChange={(e) => setCard({ ...card, cardExpirationMonth: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="mp-exp-y" className="mb-1 block text-sm font-medium">
                Ano
              </label>
              <Input
                id="mp-exp-y"
                inputMode="numeric"
                autoComplete="cc-exp-year"
                placeholder="AA"
                value={card.cardExpirationYear}
                onChange={(e) => setCard({ ...card, cardExpirationYear: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="mp-cvv" className="mb-1 block text-sm font-medium">
                CVV
              </label>
              <Input
                id="mp-cvv"
                inputMode="numeric"
                autoComplete="cc-csc"
                value={card.securityCode}
                onChange={(e) => setCard({ ...card, securityCode: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
          </div>
          <div>
            <label htmlFor="mp-doc" className="mb-1 block text-sm font-medium">
              CPF do titular
            </label>
            <Input
              id="mp-doc"
              inputMode="numeric"
              value={card.identificationNumber}
              onChange={(e) => setCard({ ...card, identificationNumber: e.target.value })}
              required
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="mp-installments" className="mb-1 block text-sm font-medium">
              Parcelas
            </label>
            <select
              id="mp-installments"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={card.installments}
              onChange={(e) => setCard({ ...card, installments: Number(e.target.value) || 1 })}
              disabled={submitting}
            >
              {installmentOptions.length > 0 ? (
                installmentOptions.map((opt) => (
                  <option key={opt.installments} value={opt.installments}>
                    {opt.recommendedMessage ||
                      `${opt.installments}x de R$ ${opt.installmentAmount.toFixed(2)} (total R$ ${opt.totalAmount.toFixed(2)})`}
                  </option>
                ))
              ) : (
                <option value={1}>1x de R$ {amount.toFixed(2)}</option>
              )}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Opções oficiais do Mercado Pago (não hardcoded).
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Pagamento processado com segurança pelo Mercado Pago. Dados do cartão não são armazenados pela EccoPet.
          </p>
          <Button type="submit" disabled={submitting} className="w-full" aria-busy={submitting}>
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner label="" />
                Processando pagamento…
              </span>
            ) : (
              `Pagar R$ ${amount.toFixed(2)}`
            )}
          </Button>
        </form>
      ) : null}

      {method === "pix" && !result ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Pix — aprovação rápida.</p>
          <Button
            type="button"
            className="w-full"
            disabled={submitting}
            onClick={() => void handleAltPay("pix")}
          >
            {submitting ? "Gerando Pix…" : "Gerar Pix"}
          </Button>
        </div>
      ) : null}

      {method === "boleto" && !result ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleAltPay("boleto");
          }}
        >
          <p className="text-xs text-muted-foreground">
            O boleto permanece em “Aguardando compensação”. O pedido não é marcado como pago na emissão.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="mp-boleto-first" className="mb-1 block text-sm font-medium">
                Nome
              </label>
              <Input
                id="mp-boleto-first"
                value={boleto.firstName}
                onChange={(e) => setBoleto({ ...boleto, firstName: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="mp-boleto-last" className="mb-1 block text-sm font-medium">
                Sobrenome
              </label>
              <Input
                id="mp-boleto-last"
                value={boleto.lastName}
                onChange={(e) => setBoleto({ ...boleto, lastName: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
          </div>
          <div>
            <label htmlFor="mp-boleto-cpf" className="mb-1 block text-sm font-medium">
              CPF do pagador
            </label>
            <Input
              id="mp-boleto-cpf"
              inputMode="numeric"
              value={boleto.identificationNumber}
              onChange={(e) => setBoleto({ ...boleto, identificationNumber: e.target.value })}
              required
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="mp-boleto-zip" className="mb-1 block text-sm font-medium">
              CEP
            </label>
            <Input
              id="mp-boleto-zip"
              inputMode="numeric"
              value={boleto.zipCode}
              onChange={(e) => setBoleto({ ...boleto, zipCode: e.target.value })}
              disabled={submitting}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Gerando boleto…" : "Gerar boleto"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
