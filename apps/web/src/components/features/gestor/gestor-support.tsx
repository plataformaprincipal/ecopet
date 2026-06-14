"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { fetchGestorTickets, type SupportTicket } from "@/lib/gestor/api";
import { GestorError, GestorLoading } from "./gestor-shell";

export function GestorSupportPanel() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGestorTickets()
      .then(setTickets)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <GestorLoading />;
  if (error) return <GestorError message={error} />;

  return (
    <div className="space-y-3">
      {tickets.map((t) => (
        <article key={t.id} className="card-premium rounded-[16px] border border-ecopet-gray/10 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ecopet-gray">#{t.number}</span>
            <Badge>{t.status}</Badge>
            <Badge variant="outline">{t.priority}</Badge>
            <Badge variant="secondary">{t.category}</Badge>
          </div>
          <h3 className="mt-2 font-semibold">{t.subject}</h3>
          <p className="text-sm text-ecopet-gray">{t.description}</p>
          <p className="mt-2 text-xs text-ecopet-gray">
            {t.requester.name} ({t.requester.role}) · {new Date(t.createdAt).toLocaleString("pt-BR")}
          </p>
        </article>
      ))}
    </div>
  );
}
