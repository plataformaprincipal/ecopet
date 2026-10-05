"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckoutTestBanner } from "@/components/features/marketplace/checkout-test-banner";

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
    id?: string | null;
    ticketUrl?: string | null;
    qrCode?: string | null;
    qrCodeBase64?: string | null;
  } | null;
};

type Props = {
  orderId: string;
  amount: number;
  payerEmail: string;
  onPaid: (result: PayResult) => void;
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

/**
 * Checkout TEST isolado — tokenização no browser com Public Key TEST.
 * Nunca envia Access Token; APIs apenas em /api/checkout-test/*.
 */
export function MercadoPagoTestCheckout({ orderId, amount, payerEmail, onPaid }: Props) {
  const [config, setConfig] = useState<MpConfig | null>(null);
  const [method, setMethod] = useState<"card" | "pix" | "boleto">("card");
  const [enabledMethods, setEnabledMethods] = useState<Array<"card" | "pix" | "boleto">>(["card"]);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/checkout-test/mercado-pago/config", { credentials: "include" });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message ?? "Checkout de teste indisponível");
        }
        await loadMpSdk();
        const methodsRes = await fetch("/api/checkout-test/mercado-pago/payment-methods", {
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
            setMethod(next[0]);
          }
        }
        if (!cancelled) {
          setConfig(json.data);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Falha ao carregar Mercado Pago TEST");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const digits = card.cardNumber.replace(/\D/g, "");
    if (digits.length < 6 || method !== "card") return;
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/checkout-test/mercado-pago/installments", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, bin: digits.slice(0, 6) }),
          });
          const json = await res.json();
          if (res.ok && json.success) {
            setInstallmentOptions(json.data.options ?? []);
          }
        } catch {
          /* ignore */
        }
      })();
    }, 400);
    return () => clearTimeout(t);
  }, [card.cardNumber, method, orderId]);

  const payOnline = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch("/api/checkout-test/mercado-pago/order", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message ?? "Falha no pagamento de teste");
    }
    return json.data as PayResult;
  }, []);

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
        cardExpirationYear:
          card.cardExpirationYear.length === 2 ? `20${card.cardExpirationYear}` : card.cardExpirationYear,
        securityCode: card.securityCode,
        identificationType: card.identificationType,
        identificationNumber: card.identificationNumber.replace(/\D/g, ""),
      });

      const paid = await payOnline({
        orderId,
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
        setError("Pagamento de teste não concluído. Nenhuma cobrança real foi feita.");
        return;
      }
      onPaid(paid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao pagar com cartão de teste");
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
      const paid = await payOnline({
        orderId,
        paymentMethodId: alt,
        payerEmail,
      });
      setResult(paid);
      const status = String(paid.status).toUpperCase();
      if (["REJECTED", "CANCELLED", "EXPIRED", "ERROR"].includes(status)) {
        setError("Pagamento de teste não concluído. Nenhuma cobrança real foi feita.");
        return;
      }
      onPaid(paid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar pagamento de teste");
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        Carregando checkout de teste…
      </p>
    );
  }

  if (!config) {
    return (
      <div role="alert" className="space-y-2 text-sm text-red-600">
        <p>{error || "Checkout de teste indisponível. Credenciais TEST ausentes."}</p>
      </div>
    );
  }

  const mpOrderId = result?.providerOrderId || result?.mpOrder?.id;

  return (
    <div className="space-y-4 rounded-lg border border-amber-400 p-4" aria-label="Checkout Mercado Pago TEST">
      <CheckoutTestBanner />
      <div>
        <p className="text-sm font-medium">Pagar online (Mercado Pago TEST)</p>
        <p className="text-xs text-muted-foreground">
          Ambiente TESTE · R$ {amount.toFixed(2)} · API Orders
        </p>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Método de pagamento de teste">
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

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="space-y-2 rounded border border-dashed p-3 text-sm" role="status">
          <p>
            Status: <strong>{result.status}</strong>
            {result.statusDetail ? ` (${result.statusDetail})` : ""}
          </p>
          {mpOrderId ? (
            <p className="break-all font-mono text-xs">
              Mercado Pago Order ID: <strong>{mpOrderId}</strong>
            </p>
          ) : null}
          {result.mpOrder?.qrCode ? (
            <div className="space-y-2">
              <p className="break-all font-mono text-xs">PIX: {result.mpOrder.qrCode}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void navigator.clipboard.writeText(result.mpOrder?.qrCode || "")}
              >
                Copiar código Pix
              </Button>
            </div>
          ) : null}
          {result.mpOrder?.qrCodeBase64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:image/png;base64,${result.mpOrder.qrCodeBase64}`}
              alt="QR Code PIX de teste"
              className="h-40 w-40"
            />
          ) : null}
          {result.mpOrder?.ticketUrl ? (
            <a
              href={result.mpOrder.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Abrir boleto de teste
            </a>
          ) : null}
        </div>
      ) : null}

      {method === "card" && !result ? (
        <form onSubmit={handleCardPay} className="space-y-3" noValidate>
          <div>
            <label htmlFor="mp-test-card-number" className="mb-1 block text-sm font-medium">
              Número do cartão de teste
            </label>
            <Input
              id="mp-test-card-number"
              inputMode="numeric"
              autoComplete="cc-number"
              value={card.cardNumber}
              onChange={(e) => setCard({ ...card, cardNumber: e.target.value })}
              required
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="mp-test-card-name" className="mb-1 block text-sm font-medium">
              Nome no cartão
            </label>
            <Input
              id="mp-test-card-name"
              autoComplete="cc-name"
              value={card.cardholderName}
              onChange={(e) => setCard({ ...card, cardholderName: e.target.value })}
              required
              disabled={submitting}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="mp-test-exp-m" className="mb-1 block text-sm font-medium">
                Mês
              </label>
              <Input
                id="mp-test-exp-m"
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
              <label htmlFor="mp-test-exp-y" className="mb-1 block text-sm font-medium">
                Ano
              </label>
              <Input
                id="mp-test-exp-y"
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
              <label htmlFor="mp-test-cvv" className="mb-1 block text-sm font-medium">
                CVV
              </label>
              <Input
                id="mp-test-cvv"
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
            <label htmlFor="mp-test-doc" className="mb-1 block text-sm font-medium">
              CPF do titular
            </label>
            <Input
              id="mp-test-doc"
              inputMode="numeric"
              value={card.identificationNumber}
              onChange={(e) => setCard({ ...card, identificationNumber: e.target.value })}
              required
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="mp-test-installments" className="mb-1 block text-sm font-medium">
              Parcelas
            </label>
            <select
              id="mp-test-installments"
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
          </div>
          <p className="text-xs text-muted-foreground">
            Use um cartão de teste do Mercado Pago. O EcoPet não armazena número nem CVV.
          </p>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Processando teste…" : `Pagar teste R$ ${amount.toFixed(2)}`}
          </Button>
        </form>
      ) : null}

      {method === "pix" && !result ? (
        <Button type="button" className="w-full" disabled={submitting} onClick={() => void handleAltPay("pix")}>
          {submitting ? "Gerando PIX de teste…" : "Gerar PIX de teste"}
        </Button>
      ) : null}

      {method === "boleto" && !result ? (
        <Button type="button" className="w-full" disabled={submitting} onClick={() => void handleAltPay("boleto")}>
          {submitting ? "Gerando boleto de teste…" : "Gerar boleto de teste"}
        </Button>
      ) : null}
    </div>
  );
}
