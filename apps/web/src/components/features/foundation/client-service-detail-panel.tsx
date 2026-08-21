"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchWithTimeout } from "@/lib/http/fetch-with-timeout";

type LoadState = "loading" | "success" | "empty" | "error";

export function ClientServiceDetailPanel() {
  const params = useParams();
  const serviceId = String(params.serviceId);
  const [service, setService] = useState<Record<string, unknown> | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");

  function load() {
    setState("loading");
    setError("");
    fetchWithTimeout(`/api/client/services/${serviceId}`, { timeoutMs: 12_000 })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.service) {
          setService(d.data.service);
          setState("success");
          return;
        }
        setService(null);
        setState("empty");
        setError(d.error?.message ?? "Serviço não encontrado.");
      })
      .catch((e) => {
        setService(null);
        setState("error");
        setError(e instanceof Error ? e.message : "Não foi possível carregar o serviço.");
      });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  if (state === "loading") return <p className="text-sm">Carregando...</p>;
  if (state === "error" || state === "empty" || !service) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-red-600">{error || "Serviço não encontrado."}</p>
        <Button size="sm" variant="outline" onClick={load}>
          Tentar novamente
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/client/services">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4 text-sm">
        <p className="text-lg font-medium">{String(service.name)}</p>
        <p>{String(service.description)}</p>
        <p>Preço: R$ {Number(service.price).toFixed(2)}</p>
        <Button asChild>
          <Link href={`/dashboard/client/appointments/new?serviceId=${serviceId}`}>Agendar</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/client/services">Voltar</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
