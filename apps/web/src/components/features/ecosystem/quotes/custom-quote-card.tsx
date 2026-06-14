"use client";

import { useState } from "react";
import { Calendar, Clock, Check, X, MessageSquare, ShoppingCart, AlertTriangle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMpPrice } from "@/lib/marketplace/config";
import type { CustomQuote, QuoteStatus } from "@/lib/ecosystem/types";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<QuoteStatus, { label: string; variant: "default" | "secondary" | "verified" | "premium" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  sent: { label: "Enviado", variant: "default" },
  viewed: { label: "Visualizado", variant: "default" },
  accepted: { label: "Aceito", variant: "verified" },
  rejected: { label: "Recusado", variant: "secondary" },
  expired: { label: "Expirado", variant: "secondary" },
  negotiating: { label: "Em negociação", variant: "premium" },
  converted: { label: "Convertido em pedido", variant: "verified" },
  completed: { label: "Concluído", variant: "verified" },
};

interface CustomQuoteCardProps {
  quote: CustomQuote;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onRequestChange?: (id: string) => void;
  onAddToCart?: (id: string) => void;
  compact?: boolean;
}

function isExpiringSoon(validUntil: string) {
  const diff = new Date(validUntil).getTime() - Date.now();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
}

export function CustomQuoteCard({ quote, onAccept, onReject, onRequestChange, onAddToCart, compact }: CustomQuoteCardProps) {
  const [expanded, setExpanded] = useState(!compact);
  const status = STATUS_LABELS[quote.status];
  const expiring = isExpiringSoon(quote.validUntil);
  const canAddToCart = quote.status === "accepted" || quote.status === "sent";

  return (
    <article className="card-premium overflow-hidden rounded-[16px] border border-ecopet-gray/10">
      <div className="border-b border-ecopet-gray/10 bg-ecopet-green/5 px-4 py-3 lg:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display font-bold">{quote.name}</h3>
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant="outline" className="text-[10px]">v{quote.version}</Badge>
            </div>
            <p className="mt-1 text-sm text-ecopet-gray">{quote.partnerName} → {quote.clientName}</p>
          </div>
          <p className="font-display text-xl font-extrabold text-ecopet-green">{formatMpPrice(quote.value)}</p>
        </div>
      </div>

      <div className="space-y-4 p-4 lg:p-5">
        {expiring && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Orçamento expira em {new Date(quote.validUntil).toLocaleDateString("pt-BR")}
          </div>
        )}

        <p className="text-sm text-ecopet-gray">{quote.description}</p>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-ecopet-gray/5 p-3 text-center dark:bg-white/5">
            <Calendar className="mx-auto h-4 w-4 text-ecopet-green" />
            <p className="mt-1 text-xs text-ecopet-gray">Validade</p>
            <p className="text-sm font-semibold">{new Date(quote.validUntil).toLocaleDateString("pt-BR")}</p>
          </div>
          <div className="rounded-xl bg-ecopet-gray/5 p-3 text-center dark:bg-white/5">
            <Clock className="mx-auto h-4 w-4 text-ecopet-green" />
            <p className="mt-1 text-xs text-ecopet-gray">Execução até</p>
            <p className="text-sm font-semibold">{new Date(quote.executionDeadline).toLocaleDateString("pt-BR")}</p>
          </div>
          <div className="rounded-xl bg-ecopet-green/10 p-3 text-center">
            <p className="text-xs text-ecopet-gray">Emissão</p>
            <p className="text-sm font-semibold">{new Date(quote.issuedAt).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>

        {expanded && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-ecopet-green">Incluído</h4>
                <ul className="space-y-1 text-sm">
                  {quote.includedItems.map((item) => (
                    <li key={item} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-ecopet-gray">Não incluído</h4>
                <ul className="space-y-1 text-sm text-ecopet-gray">
                  {quote.excludedItems.map((item) => (
                    <li key={item} className="flex items-center gap-2"><X className="h-3.5 w-3.5" /> {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl bg-ecopet-gray/5 p-3 text-sm dark:bg-white/5">
              <p className="font-semibold">Condições</p>
              <p className="mt-1 text-ecopet-gray">{quote.conditions}</p>
              {quote.notes && <p className="mt-2 text-ecopet-gray"><strong>Obs:</strong> {quote.notes}</p>}
            </div>

            {quote.history && quote.history.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-ecopet-gray">
                  <History className="h-3.5 w-3.5" /> Histórico
                </h4>
                <div className="space-y-1">
                  {quote.history.map((h, i) => (
                    <p key={i} className="text-xs text-ecopet-gray">{h.date} — {h.action} ({h.by})</p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-2 border-t border-ecopet-gray/10 pt-4">
          {canAddToCart && onAddToCart && (
            <Button size="sm" onClick={() => onAddToCart(quote.id)}><ShoppingCart className="h-4 w-4" /> Adicionar ao carrinho</Button>
          )}
          {quote.status === "sent" && onAccept && (
            <Button size="sm" variant="default" onClick={() => onAccept(quote.id)}><Check className="h-4 w-4" /> Aceitar</Button>
          )}
          {quote.status === "sent" && onRequestChange && (
            <Button size="sm" variant="outline" onClick={() => onRequestChange(quote.id)}><MessageSquare className="h-4 w-4" /> Solicitar alteração</Button>
          )}
          {quote.status === "sent" && onReject && (
            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onReject(quote.id)}><X className="h-4 w-4" /> Recusar</Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Recolher" : "Ver detalhes"}
          </Button>
        </div>
      </div>
    </article>
  );
}
