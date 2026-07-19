"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NearbyResultsMap } from "@/components/maps/nearby-results-map";
import { AdminPageHeader } from "./ui/admin-page-header";
import type { NearbyResult } from "@/lib/google-maps/types";

export function AdminEntityMapPanel({
  type,
  title,
}: {
  type: "partner" | "ong";
  title: string;
}) {
  const [results, setResults] = useState<NearbyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/maps/entities?type=${type}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha ao carregar.");
        return;
      }
      const entities = (json.data.entities || []) as Array<{
        id: string;
        name: string;
        city?: string;
        state?: string;
        category?: string;
        lat: number;
        lng: number;
        approximate?: boolean;
      }>;
      setResults(
        entities.map((e) => ({
          id: e.id,
          type,
          name: e.name,
          city: e.city,
          state: e.state,
          category: e.category,
          latitude: e.lat,
          longitude: e.lng,
          distanceKm: 0,
          approximate: Boolean(e.approximate),
        }))
      );
    } catch {
      setError("Não foi possível carregar o mapa.");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title={title}
        description="Visualização administrativa. Lista textual disponível abaixo do mapa."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Localizações", href: "/admin/localizacoes" },
          { label: title },
        ]}
      >
        <Button asChild variant="outline">
          <Link href="/admin/localizacoes">Voltar</Link>
        </Button>
      </AdminPageHeader>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}
      {!loading ? <NearbyResultsMap results={results} /> : null}
    </div>
  );
}
