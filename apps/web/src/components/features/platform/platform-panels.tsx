"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GestorLoading, GestorError } from "@/components/features/gestor/gestor-shell";

interface Metric { label: string; value: number | string; suffix?: string }
interface Insight { title: string; description: string; priority: string }

export function MetricsGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m) => (
        <Card key={m.label} className="card-premium">
          <CardContent className="p-4">
            <p className="text-xs text-ecopet-gray">{m.label}</p>
            <p className="font-display text-2xl font-bold">{m.value}{m.suffix ?? ""}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function InsightsList({ insights }: { insights: Insight[] }) {
  if (!insights?.length) return null;
  return (
    <Card className="card-premium border-ecopet-green/20">
      <CardHeader><CardTitle className="text-base">EcoPet Intelligence</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {insights.map((i, idx) => (
          <div key={idx} className="rounded-xl border border-ecopet-gray/10 p-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={i.priority === "high" ? "destructive" : "outline"}>{i.priority}</Badge>
              <span className="font-semibold">{i.title}</span>
            </div>
            <p className="mt-1 text-ecopet-gray">{i.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ItemsList({ title, items, renderItem }: {
  title: string;
  items: Record<string, unknown>[];
  renderItem: (item: Record<string, unknown>) => React.ReactNode;
}) {
  return (
    <Card className="card-premium">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && <p className="text-sm text-ecopet-gray">Nenhum registro.</p>}
        {items.map((item, idx) => (
          <div key={(item.id as string) ?? idx} className="rounded-xl border border-ecopet-gray/10 p-3 text-sm">
            {renderItem(item)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function PlatformModulePanel({
  title,
  description,
  fetcher,
  renderContent,
  actions,
}: {
  title: string;
  description?: string;
  fetcher: () => Promise<Record<string, unknown>>;
  renderContent: (data: Record<string, unknown>) => React.ReactNode;
  actions?: React.ReactNode;
}) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetcher().then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [fetcher]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <GestorLoading />;
  if (error) return <GestorError message={error} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">{title}</h2>
          {description && <p className="text-sm text-ecopet-gray">{description}</p>}
        </div>
        {actions ?? <Button variant="outline" size="sm" onClick={load}>Atualizar</Button>}
      </div>
      {renderContent(data)}
    </div>
  );
}
