"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIErrorState } from "@/components/features/ai/ai-error-state";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include", cache: "no-store" });
  const body = await res.json();
  if (!res.ok || body.success === false) throw new Error(body.error?.message ?? "Erro ao carregar");
  return body.data as T;
}

type SectionProps = {
  title: string;
  description?: string;
  endpoint: string;
  render: (data: unknown) => React.ReactNode;
};

export function AdminAiSection({ title, description, endpoint, render }: SectionProps) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchJson(endpoint));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Carregando…</p>;
  if (error) return <div className="p-6"><AIErrorState message={error} onRetry={load} /></div>;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {render(data)}
    </div>
  );
}

export function AdminAiProviderBanner({ configured }: { configured: boolean }) {
  return (
    <Card className="mx-6 mt-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Provedor de IA</CardTitle>
        <CardDescription>
          {configured
            ? "Provedor registrado e pronto para uso."
            : "AI Provider not configured. — Integração pendente (OPENAI_API_KEY)."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant={configured ? "default" : "secondary"}>
          {configured ? "Configurado" : "Aguardando integração"}
        </Badge>
      </CardContent>
    </Card>
  );
}

export { fetchJson };
