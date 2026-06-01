"use client";

import { PlatformModulePanel, MetricsGrid, InsightsList, ItemsList } from "@/components/platform/platform-panels";
import {
  fetchWorkflows, runWorkflow, fetchSlaDashboard, fetchBusinessRules,
  fetchPlatformEvents, fetchIntelligence, fetchCostDashboard, fetchDataLayer,
  fetchObservability, fetchBackups, triggerBackup, fetchFeatureFlags, toggleFeatureFlag,
  fetchLgpdDashboard, fetchOrganizations, seedPlatformInfra,
} from "@/lib/platform/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function WorkflowCenterPanel({ scope }: { scope?: string }) {
  return (
    <PlatformModulePanel
      title="Workflow Center"
      description="Automações Quando → Então — estilo N8N / Make / Zapier"
      fetcher={async () => ({ items: await fetchWorkflows(scope) })}
      renderContent={(data) => (
        <ItemsList
          title="Workflows configurados"
          items={(data.items as Record<string, unknown>[]) ?? []}
          renderItem={(w) => (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{String(w.name)}</p>
                <p className="text-xs text-ecopet-gray">{String(w.triggerType)} · {String(w.personaScope)}</p>
                {w.description ? <p className="text-xs text-ecopet-gray">{String(w.description)}</p> : null}
              </div>
              <div className="flex gap-2">
                <Badge variant={w.isActive ? "default" : "outline"}>{w.isActive ? "Ativo" : "Inativo"}</Badge>
                <Button size="sm" variant="outline" onClick={() => runWorkflow(String(w.id)).then(() => window.location.reload())}>Executar</Button>
              </div>
            </div>
          )}
        />
      )}
    />
  );
}

export function SlaCenterPanel() {
  return (
    <PlatformModulePanel
      title="SLA Center"
      description="SLA aplicado automaticamente em tickets e denúncias — tempo de resposta e resolução"
      fetcher={fetchSlaDashboard as () => Promise<Record<string, unknown>>}
      renderContent={(data) => (
        <>
          <MetricsGrid metrics={(data.metrics as { label: string; value: number; suffix?: string }[]) ?? []} />
          <InsightsList insights={(data.aiInsights as { title: string; description: string; priority: string }[]) ?? []} />
          <ItemsList
            title="SLAs em andamento / recentes"
            items={(data.recentRecords as Record<string, unknown>[]) ?? []}
            renderItem={(r) => (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{String(r.entityLabel ?? r.entityType)}</p>
                  <p className="text-xs text-ecopet-gray">
                    {String((r.policy as Record<string, unknown>)?.name ?? "Política")} · vence {new Date(String(r.dueAt)).toLocaleString("pt-BR")}
                  </p>
                </div>
                <Badge variant={r.status === "BREACHED" ? "destructive" : r.status === "MET" ? "default" : "outline"}>
                  {String(r.status)}
                </Badge>
              </div>
            )}
          />
          <ItemsList title="Políticas SLA" items={(data.policies as Record<string, unknown>[]) ?? []} renderItem={(p) => (
            <div>
              <p className="font-semibold">{String(p.name)}</p>
              <p className="text-xs text-ecopet-gray">{String(p.entityType)} · resposta {String(p.responseMins)}min · resolução {String(p.resolutionMins)}min</p>
            </div>
          )} />
        </>
      )}
    />
  );
}

export function RulesEnginePanel({ scope }: { scope?: string }) {
  return (
    <PlatformModulePanel
      title="Motor de Regras"
      description="SE → ENTÃO — regras declarativas automáticas"
      fetcher={async () => ({ items: await fetchBusinessRules(scope) })}
      renderContent={(data) => (
        <ItemsList title="Regras ativas" items={(data.items as Record<string, unknown>[]) ?? []} renderItem={(r) => (
          <div>
            <p className="font-semibold">{String(r.name)}</p>
            <p className="text-xs text-ecopet-gray">{String(r.personaScope)} · prioridade {String(r.priority)}</p>
            {r.description ? <p className="text-xs">{String(r.description)}</p> : null}
          </div>
        )} />
      )}
    />
  );
}

export function EventCenterPanel({ scope }: { scope?: string }) {
  return (
    <PlatformModulePanel
      title="Event Center"
      description="Eventos da plataforma alimentando BI, IA, robôs e auditoria"
      fetcher={async () => ({ items: await fetchPlatformEvents(scope) })}
      renderContent={(data) => (
        <ItemsList title="Eventos recentes" items={(data.items as Record<string, unknown>[]) ?? []} renderItem={(e) => (
          <div>
            <div className="flex gap-2"><Badge variant="outline">{String(e.eventType)}</Badge><Badge>{String(e.personaScope)}</Badge></div>
            <p className="mt-1 text-xs text-ecopet-gray">{new Date(String(e.createdAt)).toLocaleString("pt-BR")}</p>
          </div>
        )} />
      )}
    />
  );
}

export function IntelligencePanel({ scope = "GESTOR" }: { scope?: string }) {
  return (
    <PlatformModulePanel
      title="EcoPet Intelligence"
      description="Cérebro corporativo — insights, riscos e previsões"
      fetcher={() => fetchIntelligence(scope) as Promise<Record<string, unknown>>}
      renderContent={(data) => (
        <>
          <MetricsGrid metrics={(data.metrics as { label: string; value: number }[]) ?? []} />
          <InsightsList insights={((data.insights as Record<string, unknown>[]) ?? []).map((i) => ({
            title: String(i.title),
            description: String(i.description ?? i.suggestion ?? ""),
            priority: String(i.severity ?? i.priority ?? "info"),
          }))} />
        </>
      )}
    />
  );
}

export function CostCenterPanel() {
  return (
    <PlatformModulePanel
      title="Central de Custos"
      description="IA, APIs, e-mail, storage, robôs e integrações"
      fetcher={fetchCostDashboard as () => Promise<Record<string, unknown>>}
      renderContent={(data) => (
        <>
          <MetricsGrid metrics={(data.metrics as { label: string; value: number }[]) ?? []} />
          <ItemsList title="Lançamentos recentes" items={(data.entries as Record<string, unknown>[]) ?? []} renderItem={(e) => (
            <div className="flex justify-between"><span>{String(e.category)}</span><span className="font-semibold">R$ {Number(e.amount).toFixed(2)}</span></div>
          )} />
        </>
      )}
    />
  );
}

export function DataLayerPanel() {
  return (
    <PlatformModulePanel
      title="Data Layer"
      description="Data Lake, Warehouse, Mart e ETL"
      fetcher={fetchDataLayer as () => Promise<Record<string, unknown>>}
      renderContent={(data) => (
        <>
          <MetricsGrid metrics={(data.metrics as { label: string; value: number }[]) ?? []} />
          <ItemsList title="Pipelines" items={(data.pipelines as Record<string, unknown>[]) ?? []} renderItem={(p) => (
            <div className="flex justify-between"><span>{String(p.name)}</span><Badge>{String(p.layer)}</Badge></div>
          )} />
        </>
      )}
    />
  );
}

export function ObservabilityPanel() {
  return (
    <PlatformModulePanel
      title="Observabilidade"
      description="Frontend, backend, APIs, IA, robôs e IoT"
      fetcher={fetchObservability as () => Promise<Record<string, unknown>>}
      renderContent={(data) => (
        <>
          <MetricsGrid metrics={(data.metrics as { label: string; value: number; suffix?: string }[]) ?? []} />
          <ItemsList title="Health checks" items={(data.health as Record<string, unknown>[]) ?? []} renderItem={(h) => (
            <div className="flex justify-between"><span>{String(h.service)}</span><Badge variant={h.status === "healthy" || h.status === "ok" ? "default" : "destructive"}>{String(h.status)}</Badge></div>
          )} />
          <ItemsList title="Erros abertos" items={(data.errors as Record<string, unknown>[]) ?? []} renderItem={(e) => (
            <p className="text-red-600">{String(e.message)}</p>
          )} />
        </>
      )}
    />
  );
}

export function BackupCenterPanel() {
  return (
    <PlatformModulePanel
      title="Backup Center"
      description="Backup automático, manual, snapshots e restauração"
      fetcher={async () => ({ items: await fetchBackups() })}
      actions={<Button size="sm" onClick={() => triggerBackup("manual").then(() => window.location.reload())}>Novo backup</Button>}
      renderContent={(data) => (
        <ItemsList title="Backups" items={(data.items as Record<string, unknown>[]) ?? []} renderItem={(b) => (
          <div className="flex justify-between"><span>{String(b.type)} · {String(b.status)}</span><span className="text-xs text-ecopet-gray">{new Date(String(b.createdAt)).toLocaleString("pt-BR")}</span></div>
        )} />
      )}
    />
  );
}

export function FeatureManagementPanel() {
  return (
    <PlatformModulePanel
      title="Feature Management"
      description="Ativar/desativar módulos sem alterar código"
      fetcher={async () => ({ items: await fetchFeatureFlags() })}
      renderContent={(data) => (
        <ItemsList title="Feature flags" items={(data.items as Record<string, unknown>[]) ?? []} renderItem={(f) => (
          <div className="flex items-center justify-between">
            <div><p className="font-semibold">{String(f.name)}</p><p className="text-xs text-ecopet-gray">{String(f.key)}</p></div>
            <Button size="sm" variant={f.enabled ? "default" : "outline"} onClick={() => toggleFeatureFlag({ key: f.key, name: f.name, enabled: !f.enabled }).then(() => window.location.reload())}>
              {f.enabled ? "Ativo" : "Inativo"}
            </Button>
          </div>
        )} />
      )}
    />
  );
}

export function GovernancePanel() {
  return (
    <PlatformModulePanel
      title="Governança & Compliance"
      description="LGPD corporativa, organizações e retenção de dados"
      fetcher={async () => {
        const [lgpd, orgs] = await Promise.all([fetchLgpdDashboard(), fetchOrganizations()]);
        return { lgpd, orgs };
      }}
      renderContent={(data) => {
        const lgpd = data.lgpd as Record<string, unknown>;
        const orgs = data.orgs as Record<string, unknown>[];
        return (
          <>
            <ItemsList title="Solicitações LGPD" items={(lgpd.requests as Record<string, unknown>[]) ?? []} renderItem={(r) => (
              <div className="flex justify-between"><span>{String(r.type)}</span><Badge>{String(r.status)}</Badge></div>
            )} />
            <ItemsList title="Políticas de retenção" items={(lgpd.retentionPolicies as Record<string, unknown>[]) ?? []} renderItem={(p) => (
              <p>{String(p.name)} — {String(p.retentionDays)} dias</p>
            )} />
            <ItemsList title="Organizações" items={orgs ?? []} renderItem={(o) => (
              <p className="font-semibold">{String(o.name)} <Badge variant="outline">{String(o.type)}</Badge></p>
            )} />
            <Button variant="outline" onClick={() => seedPlatformInfra().then(() => window.location.reload())}>Reinicializar infraestrutura plataforma</Button>
          </>
        );
      }}
    />
  );
}
