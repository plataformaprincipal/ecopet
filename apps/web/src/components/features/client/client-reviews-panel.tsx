"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchWithTimeout } from "@/lib/http/fetch-with-timeout";

type ReviewItem = {
  id: string;
  kind: "product" | "service";
  targetName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export function ClientReviewsPanel() {
  const [reviews, setReviews] = useState<ReviewItem[] | null>(null);
  const [error, setError] = useState("");

  function load() {
    setError("");
    fetchWithTimeout("/api/reviews?mine=1", { timeoutMs: 12_000 })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setReviews(d.data.reviews ?? []);
        else {
          setReviews([]);
          setError(d.error?.message ?? "Não foi possível carregar as avaliações.");
        }
      })
      .catch((e) => {
        setReviews([]);
        setError(e instanceof Error ? e.message : "Não foi possível carregar as avaliações.");
      });
  }

  useEffect(() => {
    load();
  }, []);

  if (reviews === null) return <p className="text-sm">Carregando...</p>;
  if (error && reviews.length === 0) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-red-600">{error}</p>
        <Button size="sm" variant="outline" onClick={load}>
          Tentar novamente
        </Button>
      </div>
    );
  }
  if (reviews.length === 0) {
    return (
      <div className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        <p>Você ainda não avaliou produtos ou serviços.</p>
        <Button asChild className="mt-3" size="sm">
          <Link href="/marketplace">Explorar marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4 text-sm">
          <p className="font-medium">{r.targetName}</p>
          <p className="mt-1 flex items-center gap-1 text-ecopet-yellow">
            {Array.from({ length: r.rating }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" aria-hidden />
            ))}
            <span className="ml-1 text-xs text-muted-foreground">
              {r.kind === "product" ? "Produto" : "Serviço"} · {new Date(r.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </p>
          {r.comment ? <p className="mt-2 text-[var(--ep-fg)]">{r.comment}</p> : null}
        </li>
      ))}
    </ul>
  );
}
