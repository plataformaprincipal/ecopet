"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { id: string; date: string; name: string; summary: string; href?: string };

export function PetAiTimeline({ petId }: { petId: string }) {
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => {
    fetch(`/api/ai-commerce/timeline/${petId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setItems(d.success ? d.data.items : []));
  }, [petId]);
  if (!items?.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Inteligência e saúde</h2>
      <ol className="mt-4 space-y-3">
        {items.map((i) => (
          <li key={i.id} className="flex items-start justify-between gap-3 rounded-xl border border-black/5 p-3 text-sm dark:border-white/10">
            <div>
              <p className="text-xs text-muted-foreground">{new Date(i.date).toLocaleDateString("pt-BR")}</p>
              <p className="font-medium">{i.name}</p>
              <p className="text-muted-foreground">{i.summary}</p>
            </div>
            {i.href && (
              <Link href={i.href} className="text-ecopet-green hover:underline">
                Ver
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
