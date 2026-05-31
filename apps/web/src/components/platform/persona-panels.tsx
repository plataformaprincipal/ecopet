"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricsGrid, InsightsList } from "@/components/platform/platform-panels";
import {
  fetchLgpdDashboard, createLgpdRequest, recordConsent, fetchIntelligence, fetchFeatureFlags,
} from "@/lib/platform/api";

export function PrivacyLgpdPanel({ persona }: { persona: "CLIENT" | "PARTNER" | "NGO" }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([
      fetchLgpdDashboard(),
      fetchIntelligence(persona),
      fetchFeatureFlags(persona).catch(() => []),
    ]).then(([lgpd, intel, flags]) => setData({ lgpd, intel, flags }))
      .catch(() => setData(null));
  }, [persona]);

  async function handleRequest(type: string) {
    await createLgpdRequest(type);
    setMsg(`Solicitação ${type} registrada`);
    const lgpd = await fetchLgpdDashboard();
    setData((d) => ({ ...d, lgpd }));
  }

  if (!data) return <p className="text-sm text-ecopet-gray">Carregando privacidade...</p>;

  const lgpd = data.lgpd as Record<string, unknown>;
  const intel = data.intel as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <MetricsGrid metrics={(intel.metrics as { label: string; value: number }[]) ?? []} />
      <InsightsList insights={[{ title: "IA de Privacidade", description: "Seus dados são tratados conforme LGPD. Você pode exportar, anonimizar ou solicitar exclusão.", priority: "info" }]} />

      <Card>
        <CardHeader><CardTitle>Privacidade & LGPD</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-ecopet-gray">Visualize, exporte ou solicite alteração dos seus dados conforme a LGPD.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => handleRequest("EXPORT")}>Exportar dados</Button>
            <Button size="sm" variant="outline" onClick={() => handleRequest("ACCESS")}>Acessar dados</Button>
            <Button size="sm" variant="outline" onClick={() => handleRequest("ANONYMIZE")}>Anonimizar</Button>
            <Button size="sm" variant="destructive" onClick={() => handleRequest("DELETE")}>Solicitar exclusão</Button>
          </div>
          {msg && <p className="text-sm text-ecopet-green">{msg}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Consentimentos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {["marketing", "analytics", "integrations", "health_data"].map((c) => (
            <label key={c} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span>{c.replace("_", " ")}</span>
              <input type="checkbox" defaultChecked className="accent-ecopet-green" onChange={(e) => recordConsent(c, e.target.checked)} />
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Solicitações recentes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {((lgpd.requests as Record<string, unknown>[]) ?? []).map((r) => (
            <div key={String(r.id)} className="flex justify-between text-sm"><span>{String(r.type)}</span><Badge>{String(r.status)}</Badge></div>
          ))}
        </CardContent>
      </Card>

      {persona !== "CLIENT" && (
        <Card>
          <CardHeader><CardTitle>Feature Flags ({persona})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {((data.flags as Record<string, unknown>[]) ?? []).slice(0, 8).map((f) => (
              <div key={String(f.key)} className="flex justify-between text-sm"><span>{String(f.name)}</span><Badge variant={f.enabled ? "default" : "outline"}>{f.enabled ? "On" : "Off"}</Badge></div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function PersonaWorkflowPanel({ scope }: { scope: "CLIENT" | "PARTNER" | "NGO" }) {
  const labels: Record<string, string> = {
    CLIENT: "Workflows do Cliente — saúde, vacinas, compras, agenda",
    PARTNER: "Workflows do Parceiro — vendas, estoque, marketing, logística",
    NGO: "Workflows da ONG — campanhas, adoções, doações, resgates",
  };
  return (
    <Card>
      <CardHeader><CardTitle>Automações</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-ecopet-gray">{labels[scope]}</p>
        <p className="mt-2 text-xs text-ecopet-gray">Configure automações no Workflow Center do Gestor ECOPET ou acesse via integrações.</p>
      </CardContent>
    </Card>
  );
}

export function PersonaExecutivePanel({ persona }: { persona: "CLIENT" | "PARTNER" | "NGO" }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  useEffect(() => { fetchIntelligence(persona).then(setData).catch(() => {}); }, [persona]);
  if (!data) return null;
  return (
    <>
      <MetricsGrid metrics={(data.metrics as { label: string; value: number }[]) ?? []} />
      <InsightsList insights={((data.aiInsights ?? data.insights) as { title: string; description: string; priority: string }[]) ?? []} />
    </>
  );
}
