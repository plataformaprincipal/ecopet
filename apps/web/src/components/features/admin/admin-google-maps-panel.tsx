"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "./ui/admin-page-header";
import { AdminStatusBadge } from "./ui/admin-status-badge";

type Diag = {
  provider: string;
  status: {
    configured: boolean;
    publicKeyConfigured: boolean;
    serverKeyConfigured: boolean;
    environment: string;
    status: string;
    sanitizedMessage: string;
    expectedApis: string[];
  };
  metrics: {
    usageLast7d: number;
    failuresLast7d: number;
    lastErrorCode: string | null;
    lastErrorAt: string | null;
    addressesWithCoords: number;
    addressesPending: number;
    partnersWithCoords: number;
    partnersPendingApproved: number;
    ongsWithCoords: number;
    ongsPendingApproved: number;
    byAction: Array<{ action: string; count: number }>;
  };
  notes: string[];
};

export function AdminGoogleMapsPanel() {
  const [data, setData] = useState<Diag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/integrations/google-maps/diagnostics", {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha ao carregar.");
        return;
      }
      setData(json.data as Diag);
    } catch {
      setError("Não foi possível carregar o diagnóstico.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Google Maps Platform"
        description="Diagnóstico sanitizado — sem disparar chamadas pagas ao abrir o painel."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Integrações", href: "/admin/integracoes" },
          { label: "Google Maps" },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/localizacoes">Localizações</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/integracoes">Voltar</Link>
          </Button>
        </div>
      </AdminPageHeader>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {loading && !data ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}

      {data ? (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Status</CardTitle>
                <CardDescription>{data.status.sanitizedMessage}</CardDescription>
              </div>
              <AdminStatusBadge status={data.status.status} />
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <p>Chave pública (NEXT_PUBLIC): {data.status.publicKeyConfigured ? "sim" : "não"}</p>
              <p>Chave servidor: {data.status.serverKeyConfigured ? "sim" : "não"}</p>
              <p>Ambiente: {data.status.environment}</p>
              <p>APIs esperadas: {data.status.expectedApis.join(", ")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métricas (7 dias)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
              <p>Uso: {data.metrics.usageLast7d}</p>
              <p>Falhas: {data.metrics.failuresLast7d}</p>
              <p>Último erro: {data.metrics.lastErrorCode ?? "—"}</p>
              <p>Endereços com coords: {data.metrics.addressesWithCoords}</p>
              <p>Endereços sem coords: {data.metrics.addressesPending}</p>
              <p>Parceiros com coords: {data.metrics.partnersWithCoords}</p>
              <p>Parceiros aprovados sem coords: {data.metrics.partnersPendingApproved}</p>
              <p>ONGs com coords: {data.metrics.ongsWithCoords}</p>
              <p>ONGs aprovadas sem coords: {data.metrics.ongsPendingApproved}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {data.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
