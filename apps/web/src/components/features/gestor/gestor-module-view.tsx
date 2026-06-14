"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsCards } from "@/components/features/profile/shared/analytics-cards";
import { AIInsightsPanel } from "@/components/features/profile/shared/ai-insights-panel";
import { GestorLoading, GestorError } from "./gestor-shell";
import { fetchGestorModule } from "@/lib/gestor/api";
import { TrendingUp } from "lucide-react";

interface GestorModuleViewProps {
  moduleId: string;
  title: string;
  description?: string;
}

export function GestorModuleView({ moduleId, title, description }: GestorModuleViewProps) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGestorModule(moduleId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar módulo"))
      .finally(() => setLoading(false));
  }, [moduleId]);

  if (loading) return <GestorLoading />;
  if (error) return <GestorError message={error} />;
  if (!data) return null;

  const metrics = (data.metrics as { label: string; value: number | string }[]) ?? [];
  const aiInsights = (data.aiInsights as { title: string; description: string; priority?: string }[]) ?? [];

  return (
    <div className="space-y-6">
      {description && <p className="text-sm text-ecopet-gray">{description}</p>}

      {metrics.length > 0 && (
        <AnalyticsCards
          items={metrics.map((m) => ({
            label: m.label,
            value: typeof m.value === "number" && m.value > 999 ? m.value.toLocaleString("pt-BR") : String(m.value),
            icon: TrendingUp,
          }))}
          columns={4}
        />
      )}

      {aiInsights.length > 0 && (
        <AIInsightsPanel
          insights={aiInsights.map((i, idx) => ({
            id: String(idx),
            tag: "IA Gestor",
            title: i.title,
            description: i.description,
            priority: (i.priority as "high" | "medium" | "low") ?? "medium",
          }))}
          title="Insights IA ECOPET"
        />
      )}

      {renderModuleContent(moduleId, data)}
    </div>
  );
}

function renderModuleContent(moduleId: string, data: Record<string, unknown>) {
  const listKeys = ["transactions", "reports", "partners", "documents", "robots", "conversations", "devices", "dispatches", "errors", "health", "departments", "team", "projects", "campaigns", "pipeline", "sectors"];

  for (const key of listKeys) {
    const items = data[key];
    if (Array.isArray(items) && items.length > 0) {
      return (
        <Card>
          <CardHeader><CardTitle className="capitalize">{key.replace(/([A-Z])/g, " $1")}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {items.slice(0, 30).map((item, i) => (
                <div key={i} className="rounded-xl border border-ecopet-gray/10 p-3 text-sm">
                  <pre className="whitespace-pre-wrap break-words font-sans text-xs">{JSON.stringify(item, null, 2).slice(0, 500)}</pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  if (moduleId === "sistema" && data.api) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["api", "database"].map((svc) => (
          <Card key={svc}>
            <CardContent className="p-4">
              <p className="font-semibold uppercase text-ecopet-green">{svc}</p>
              <p className="text-2xl font-bold capitalize">{String(data[svc])}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 text-sm text-ecopet-gray">
        Módulo operacional conectado ao backend ECOPET. Dados persistidos em banco de dados com auditoria e permissões RBAC.
      </CardContent>
    </Card>
  );
}
