"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function ClientServicesList() {
  const [services, setServices] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/client/services", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setServices(d.success ? d.data.services : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm">Carregando...</p>;
  if (services.length === 0) {
    return (
      <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhum serviço disponível na sua região.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {services.map((s) => (
        <div key={String(s.id)} className="rounded border p-4 text-sm">
          <p className="font-medium">{String(s.name)}</p>
          <p>{String(s.description)}</p>
          <p>Preço: R$ {Number(s.price).toFixed(2)}</p>
          <Link href={`/dashboard/client/services/${String(s.id)}`} className="underline">Detalhes</Link>
        </div>
      ))}
    </div>
  );
}
