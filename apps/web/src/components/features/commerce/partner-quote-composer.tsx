"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { commerceQuotesApi } from "@/lib/messages/client-api";

export function PartnerQuoteComposer({
  conversationId,
  onCreated,
}: {
  conversationId: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("Serviço personalizado");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState("100");
  const [shipping, setShipping] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) {
    return (
      <div className="border-t border-ecopet-gray/10 px-3 py-2">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} data-testid="open-quote-builder">
          Enviar orçamento
        </Button>
      </div>
    );
  }

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await commerceQuotesApi.create(conversationId, {
        name: "Orçamento personalizado",
        items: [{ description, quantity, unitPrice: Number(unitPrice) }],
        shippingAmount: Number(shipping) || 0,
        discountAmount: Number(discount) || 0,
        notes,
        validUntil,
      });
      setOpen(false);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar orçamento");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 border-t border-ecopet-gray/10 px-3 py-3 text-sm" data-testid="quote-builder">
      <p className="font-medium">Novo orçamento</p>
      <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" />
      <div className="grid grid-cols-3 gap-2">
        <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        <Input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="Preço unitário" />
        <Input value={shipping} onChange={(e) => setShipping(e.target.value)} placeholder="Frete" />
      </div>
      <Input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Desconto" />
      <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações" />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button size="sm" disabled={busy} onClick={() => void submit()} data-testid="send-quote">
          Enviar
        </Button>
      </div>
    </div>
  );
}
