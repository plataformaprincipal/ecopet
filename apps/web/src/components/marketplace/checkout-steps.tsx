"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MapPin, QrCode, Truck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { formatMpPrice } from "@/lib/marketplace/config";
import { cn } from "@/lib/utils";
import { checkoutOrder, type DeliveryMethod, type PaymentMethod, type Order } from "@/lib/orders/api";
import { fetchPartnerLogistics, calculateShipping, type LogisticsMethod } from "@/lib/logistics/api";
import { fetchWalletBalance } from "@/lib/wallet/api";
import { useAppStore } from "@/store/app-store";

const STEPS = [
  { id: 1, label: "Identificação" },
  { id: 2, label: "Endereço" },
  { id: 3, label: "Entrega/Retirada" },
  { id: 4, label: "Pagamento" },
  { id: 5, label: "Revisão" },
  { id: 6, label: "Confirmação" },
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "PIX", label: "PIX" },
  { value: "CARD", label: "Cartão de crédito" },
  { value: "WALLET", label: "Saldo ECOPET" },
  { value: "BOLETO", label: "Boleto" },
];

export function CheckoutSteps() {
  const [step, setStep] = useState(1);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { cart, cartSubtotal, discount, total, applyCoupon, coupon, clearCart } = useMarketplaceStore();
  const apiToken = useAppStore((s) => s.apiToken);

  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState("");

  const [identification, setIdentification] = useState({ name: "", email: "", phone: "" });
  const [address, setAddress] = useState({ zipCode: "", street: "", number: "", complement: "", city: "", state: "" });
  const [useAlternateAddress, setUseAlternateAddress] = useState(false);
  const [alternateAddress, setAlternateAddress] = useState({ zipCode: "", street: "", number: "", city: "", state: "" });

  const [deliveryMethods, setDeliveryMethods] = useState<LogisticsMethod[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("DELIVERY_LOCAL");
  const [shippingFee, setShippingFee] = useState(0);
  const [pickupInfo, setPickupInfo] = useState<{ address?: Record<string, string>; hours?: string; instructions?: string; responsible?: string } | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [thirdParty, setThirdParty] = useState({ enabled: false, name: "", document: "" });
  const [serviceMode, setServiceMode] = useState<"IN_PERSON" | "HOME" | "ONLINE" | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [walletBalance, setWalletBalance] = useState(0);

  const partnerId = cart[0]?.partnerId ?? "mp1";
  const grandTotal = total() + shippingFee;

  useEffect(() => {
    if (!partnerId || step < 3) return;
    fetchPartnerLogistics(partnerId)
      .then(({ methods, config }) => {
        setDeliveryMethods(methods);
        if (methods.length) setDeliveryMethod(methods[0].method);
        setPickupInfo({
          address: config.pickupAddress as Record<string, string>,
          hours: config.pickupHours ?? undefined,
          instructions: config.pickupInstructions ?? undefined,
          responsible: config.pickupResponsible ?? undefined,
        });
      })
      .catch(() => {});
  }, [partnerId, step]);

  useEffect(() => {
    if (!partnerId || !deliveryMethod) return;
    calculateShipping(partnerId, deliveryMethod)
      .then((r) => setShippingFee(r.fee))
      .catch(() => setShippingFee(0));
  }, [partnerId, deliveryMethod]);

  useEffect(() => {
    if (apiToken && step >= 4) {
      fetchWalletBalance().then((w) => setWalletBalance(w.balance)).catch(() => {});
    }
  }, [apiToken, step]);

  function tryCoupon() {
    const ok = applyCoupon(couponInput);
    setCouponMsg(ok ? "Cupom aplicado!" : "Cupom inválido. Tente ECOPET10, LUNA15 ou PET20");
  }

  async function handleConfirm() {
    if (!apiToken) {
      setError("Faça login para finalizar o pedido.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const shippingAddress = {
        ...address,
        recipient: identification.name,
        phone: identification.phone,
      };
      const order = await checkoutOrder({
        items: cart.map((item) => ({
          productId: item.type === "product" ? item.itemId : undefined,
          serviceId: item.type === "service" ? item.itemId : undefined,
          quoteId: item.quoteId,
          itemType: item.type,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          partnerId: item.partnerId,
        })),
        shippingAddress,
        alternateAddress: useAlternateAddress ? alternateAddress : undefined,
        deliveryMethod,
        paymentMethod,
        scheduledAt: scheduledAt || undefined,
        deliveryNotes: deliveryNotes || undefined,
        thirdPartyPickup: thirdParty.enabled ? { name: thirdParty.name, document: thirdParty.document } : undefined,
        serviceMode: serviceMode || undefined,
        partnerId,
        discount: discount(),
      });
      setConfirmedOrder(order);
      clearCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao confirmar pedido");
    } finally {
      setLoading(false);
    }
  }

  const isPickup = deliveryMethod === "PICKUP_LOCAL" || deliveryMethod === "PICKUP_SCHEDULED";

  if (confirmedOrder) {
    return (
      <Card className="border-ecopet-green/30 bg-ecopet-green/5">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-ecopet-green" />
          <h2 className="mt-4 font-display text-2xl font-bold">Pedido confirmado!</h2>
          <p className="mt-2 text-ecopet-gray">Pedido #{confirmedOrder.orderNumber} registrado com sucesso.</p>
          {confirmedOrder.pickupQrCode && (
            <div className="mx-auto mt-4 max-w-md rounded-xl border bg-white p-4 text-left text-sm">
              <p className="flex items-center gap-2 font-semibold"><QrCode className="h-4 w-4" />QR Code de retirada</p>
              <p className="mt-2 break-all font-mono text-xs">{confirmedOrder.pickupQrCode}</p>
            </div>
          )}
          {confirmedOrder.trackingCode && (
            <p className="mt-3 flex items-center justify-center gap-2 text-sm"><Truck className="h-4 w-4" />Rastreio: {confirmedOrder.trackingCode}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                step === s.id ? "bg-ecopet-green text-white" : step > s.id ? "bg-ecopet-green/20 text-ecopet-green" : "bg-ecopet-gray/10"
              )}
            >
              {s.id}. {s.label}
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step - 1].label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <Input placeholder="Nome completo" value={identification.name} onChange={(e) => setIdentification({ ...identification, name: e.target.value })} />
                <Input placeholder="E-mail" type="email" value={identification.email} onChange={(e) => setIdentification({ ...identification, email: e.target.value })} />
                <Input placeholder="Telefone" value={identification.phone} onChange={(e) => setIdentification({ ...identification, phone: e.target.value })} />
              </>
            )}

            {step === 2 && (
              <>
                <Input placeholder="CEP" value={address.zipCode} onChange={(e) => setAddress({ ...address, zipCode: e.target.value })} />
                <div className="grid grid-cols-3 gap-2">
                  <Input className="col-span-2" placeholder="Endereço" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                  <Input placeholder="Nº" value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} />
                </div>
                <Input placeholder="Complemento" value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Cidade" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  <Input placeholder="Estado" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={useAlternateAddress} onChange={(e) => setUseAlternateAddress(e.target.checked)} className="accent-ecopet-green" />
                  Receber em endereço alternativo
                </label>
                {useAlternateAddress && (
                  <div className="space-y-2 rounded-xl border p-4">
                    <Input placeholder="CEP alternativo" value={alternateAddress.zipCode} onChange={(e) => setAlternateAddress({ ...alternateAddress, zipCode: e.target.value })} />
                    <Input placeholder="Endereço alternativo" value={alternateAddress.street} onChange={(e) => setAlternateAddress({ ...alternateAddress, street: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Cidade" value={alternateAddress.city} onChange={(e) => setAlternateAddress({ ...alternateAddress, city: e.target.value })} />
                      <Input placeholder="Estado" value={alternateAddress.state} onChange={(e) => setAlternateAddress({ ...alternateAddress, state: e.target.value })} />
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid gap-2">
                  {deliveryMethods.map((m) => (
                    <label key={m.method} className={cn(
                      "flex cursor-pointer items-center justify-between rounded-xl border p-4 hover:border-ecopet-green",
                      deliveryMethod === m.method && "border-ecopet-green bg-ecopet-green/5"
                    )}>
                      <div className="flex items-center gap-2">
                        <input type="radio" name="delivery" checked={deliveryMethod === m.method} onChange={() => setDeliveryMethod(m.method)} className="accent-ecopet-green" />
                        <span className="text-sm font-medium">{m.label}</span>
                      </div>
                      <span className="text-sm text-ecopet-green">{m.fee === 0 ? "Grátis" : formatMpPrice(m.fee)}</span>
                    </label>
                  ))}
                </div>

                {(deliveryMethod === "DELIVERY_SCHEDULED" || deliveryMethod === "PICKUP_SCHEDULED") && (
                  <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                )}

                {isPickup && pickupInfo && (
                  <div className="rounded-xl border border-ecopet-green/20 bg-ecopet-green/5 p-4 text-sm space-y-2">
                    <p className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4" />Local de retirada</p>
                    {pickupInfo.address && (
                      <p>{pickupInfo.address.street}, {pickupInfo.address.number} — {pickupInfo.address.city}/{pickupInfo.address.state}</p>
                    )}
                    {pickupInfo.hours && <p>Horário: {pickupInfo.hours}</p>}
                    {pickupInfo.responsible && <p>Responsável: {pickupInfo.responsible}</p>}
                    {pickupInfo.instructions && <p className="caption-text">{pickupInfo.instructions}</p>}
                    <label className="flex items-center gap-2 pt-2">
                      <input type="checkbox" checked={thirdParty.enabled} onChange={(e) => setThirdParty({ ...thirdParty, enabled: e.target.checked })} className="accent-ecopet-green" />
                      Retirada por terceiro
                    </label>
                    {thirdParty.enabled && (
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Nome do terceiro" value={thirdParty.name} onChange={(e) => setThirdParty({ ...thirdParty, name: e.target.value })} />
                        <Input placeholder="Documento" value={thirdParty.document} onChange={(e) => setThirdParty({ ...thirdParty, document: e.target.value })} />
                      </div>
                    )}
                  </div>
                )}

                {cart.some((c) => c.type === "service") && (
                  <select className="flex h-11 w-full rounded-xl border px-4 text-sm" value={serviceMode} onChange={(e) => setServiceMode(e.target.value as typeof serviceMode)}>
                    <option value="">Modalidade do serviço</option>
                    <option value="IN_PERSON">Presencial (local do parceiro)</option>
                    <option value="HOME">Domiciliar (seu endereço)</option>
                    <option value="ONLINE">Online (link/chat/vídeo)</option>
                  </select>
                )}

                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border px-4 py-3 text-sm"
                  placeholder="Observações de entrega/agendamento"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                />
              </>
            )}

            {step === 4 && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PAYMENT_OPTIONS.map((m) => (
                    <label key={m.value} className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl border p-4 hover:border-ecopet-green",
                      paymentMethod === m.value && "border-ecopet-green bg-ecopet-green/5"
                    )}>
                      <input type="radio" name="payment" checked={paymentMethod === m.value} onChange={() => setPaymentMethod(m.value)} className="accent-ecopet-green" />
                      <span>{m.label}</span>
                      {m.value === "WALLET" && <span className="ml-auto text-xs text-ecopet-green">{formatMpPrice(walletBalance)}</span>}
                    </label>
                  ))}
                </div>
                {paymentMethod === "WALLET" && walletBalance < grandTotal && (
                  <p className="text-sm text-red-500">Saldo insuficiente. Disponível: {formatMpPrice(walletBalance)}</p>
                )}
                <div className="flex gap-2">
                  <Input placeholder="Cupom de desconto" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
                  <Button variant="outline" onClick={tryCoupon}>Aplicar</Button>
                </div>
                {couponMsg && <p className={cn("text-sm", coupon ? "text-ecopet-green" : "text-red-500")}>{couponMsg}</p>}
              </>
            )}

            {step === 5 && (
              <div className="space-y-3 text-sm">
                <p><strong>Cliente:</strong> {identification.name} · {identification.email}</p>
                <p><strong>Entrega:</strong> {deliveryMethods.find((m) => m.method === deliveryMethod)?.label ?? deliveryMethod}</p>
                <p><strong>Pagamento:</strong> {PAYMENT_OPTIONS.find((p) => p.value === paymentMethod)?.label}</p>
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between border-b border-ecopet-gray/10 pb-2">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{formatMpPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}

            {step === 6 && (
              <p className="text-sm text-ecopet-gray">
                Revise seus dados e confirme. Reembolsos PIX/dinheiro/transferência convertem automaticamente para Saldo ECOPET.
              </p>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2 pt-2">
              {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Voltar</Button>}
              {step < 6 ? (
                <Button className="flex-1" onClick={() => setStep(step + 1)}>Continuar</Button>
              ) : (
                <Button className="flex-1" size="lg" onClick={handleConfirm} disabled={loading || (paymentMethod === "WALLET" && walletBalance < grandTotal)}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processando...</> : "Confirmar pedido"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatMpPrice(cartSubtotal())}</span></div>
          <div className="flex justify-between"><span>Frete/retirada</span><span>{shippingFee === 0 ? "Grátis" : formatMpPrice(shippingFee)}</span></div>
          {discount() > 0 && <div className="flex justify-between text-ecopet-green"><span>Desconto</span><span>-{formatMpPrice(discount())}</span></div>}
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-ecopet-green">{formatMpPrice(grandTotal)}</span></div>
          <p className="pt-2 text-xs text-ecopet-gray">{cart.length} item(ns) · Checkout ECOPET</p>
        </CardContent>
      </Card>
    </div>
  );
}
