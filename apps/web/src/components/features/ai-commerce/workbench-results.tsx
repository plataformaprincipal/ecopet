"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { URGENCY_LABELS, getProductDefBySku } from "@/lib/ai-commerce/catalog";
import { CONFIDENCE_LABELS, type ConfidenceLevel } from "@/lib/ai-commerce/provenance";
import { analyticsService } from "@/lib/analytics/service";
import { AiEvents } from "@/lib/analytics/events";
import { Sparkline } from "./sparkline";
import type { CapabilityRuntime } from "@/lib/ai-commerce/capability-runtime";

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : value == null ? [] : [String(value)];
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function UrgencyBanner({ output }: { output: Record<string, unknown> }) {
  const urgency = rec(output.urgency);
  const level = String(urgency.level ?? output.urgencyLevel ?? output.triageClass ?? "");
  const label = URGENCY_LABELS[level] ?? (level === "EMERGENCY" ? "Atendimento imediato" : level);
  if (!level) return null;
  const emergency = level === "EMERGENCY" || level === "URGENT";
  return (
    <div
      role="status"
      aria-live="assertive"
      className={`rounded-[18px] border p-5 ${emergency ? "border-red-500/40 bg-red-500/10" : "border-ecopet-green/30 bg-ecopet-green/5"}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide">{emergency ? "Atendimento imediato recomendado" : "Nível de atenção"}</p>
      <p className="mt-1 text-2xl font-semibold">{label}</p>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {list(urgency.reasons).map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

export function DiagnosticImpressionCard({ output }: { output: Record<string, unknown> }) {
  const d = rec(output.diagnosticImpression);
  if (!d.status || d.status === "NOT_APPLICABLE") return null;
  const confidence = String(d.confidence ?? "INSUFFICIENT_DATA") as ConfidenceLevel;
  const diffs = Array.isArray(d.differentialDiagnoses) ? d.differentialDiagnoses : [];
  return (
    <section className="rounded-[18px] border border-ecopet-green/25 bg-[var(--ep-bg-elevated)] p-5 shadow-[var(--shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ecopet-green">Impressão Diagnóstica Assistida por IA</p>
      <p className="mt-3 text-sm text-[var(--ep-fg-muted)]">Não é diagnóstico profissional emitido por médico-veterinário.</p>
      <h3 className="mt-3 text-xl font-semibold text-[var(--ep-fg)]">{String(d.primaryHypothesis ?? "Hipótese em avaliação")}</h3>
      <p className="mt-2 text-sm">
        {CONFIDENCE_LABELS[confidence] ?? confidence}
        {d.confidenceScore != null ? ` — ${d.confidenceScore}% heurístico` : ""}
      </p>
      <p className="mt-3 text-sm leading-relaxed">{String(d.rationale ?? "")}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-ecopet-green">Compatível porque</p>
          <ul className="mt-2 space-y-1 text-sm">
            {list(d.supportingPoints).map((x) => (
              <li key={x}>✓ {x}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--ep-fg-muted)]">Contra</p>
          <ul className="mt-2 space-y-1 text-sm">
            {list(d.contradictoryPoints).map((x) => (
              <li key={x}>• {x}</li>
            ))}
          </ul>
        </div>
      </div>
      {diffs.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase">Diagnósticos diferenciais</p>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
            {diffs.map((row) => {
              const item = rec(row);
              return (
                <li key={String(item.hypothesis)}>
                  <span className="font-medium">{String(item.hypothesis)}</span>
                  <span className="text-[var(--ep-fg-muted)]"> — {String(item.likelihood)}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
      {list(d.differentiationSteps).length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase">Para diferenciar</p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {list(d.differentiationSteps).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function EvidenceTrace({ output }: { output: Record<string, unknown> }) {
  const items = Array.isArray(output.evidence) ? output.evidence : [];
  if (!items.length) return null;
  return (
    <section className="rounded-[18px] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5">
      <h3 className="font-semibold">Por que a EccoPet chegou a esta conclusão?</h3>
      <ol className="mt-3 space-y-3">
        {items.map((row, i) => {
          const e = rec(row);
          return (
            <li key={`${e.statement}-${i}`} className="rounded-2xl border border-[var(--ep-border)] p-3 text-sm">
              <p className="font-medium">{String(e.statement)}</p>
              <p className="mt-1 text-[var(--ep-fg-muted)]">
                Baseado em: {String(e.source)} · força {String(e.strength)}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function AIProgress({ phase }: { phase: string }) {
  const steps = [
    ["IDLE", "Preencha as informações"],
    ["VALIDATING", "Validando dados…"],
    ["UPLOADING", "Enviando arquivos…"],
    ["READING_DOCUMENTS", "Lendo documentos…"],
    ["ANALYZING", "Analisando informações…"],
    ["STRUCTURING", "Organizando resultados…"],
    ["GENERATING_ARTIFACTS", "Preparando seu relatório…"],
    ["COMPLETED", "Concluído"],
    ["FAILED", "Não concluído"],
  ];
  const idx = Math.max(0, steps.findIndex(([id]) => id === phase));
  return (
    <div className="rounded-[18px] border border-[var(--ep-border)] p-5" role="status" aria-live="polite">
      <p className="font-medium">{steps[idx]?.[1] ?? "Processando…"}</p>
      <ul className="mt-3 space-y-1 text-sm text-[var(--ep-fg-muted)]">
        {steps.slice(0, 7).map(([id, label], i) => (
          <li key={id}>
            {i < idx ? "✓" : i === idx ? "●" : "○"} {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ArtifactActions({
  executionId,
  sku,
  output,
  runtime,
}: {
  executionId: string;
  sku: string;
  output: Record<string, unknown>;
  runtime?: CapabilityRuntime;
}) {
  const def = getProductDefBySku(sku);
  const artifact = rec(output.artifactStatus);
  const [busyImage, setBusyImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  async function generateImage() {
    setBusyImage(true);
    const res = await fetch(`/api/ai-commerce/executions/${executionId}/generate-image`, { method: "POST", credentials: "include" });
    const data = await res.json();
    setBusyImage(false);
    if (data.success) {
      setImageUrl(data.data.url);
      analyticsService.track(AiEvents.ARTIFACT_GENERATED, { screen: "eccopet_workspace", label: sku });
    }
  }

  async function addToProfile() {
    const items = [String(output.summary ?? ""), ...list(output.nextSteps).slice(0, 4)].filter(Boolean);
    const res = await fetch(`/api/ai-commerce/executions/${executionId}/add-to-profile`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    setProfileMsg(data.success ? "Adicionado ao Health Profile após sua confirmação." : data.error?.message ?? "Não foi possível salvar.");
    if (data.success) analyticsService.track(AiEvents.HEALTH_PROFILE_ADDED, { screen: "eccopet_workspace", label: sku });
  }

  function downloadCsv() {
    const markers = Array.isArray(output.markers) ? output.markers : [];
    const rows = markers.length
      ? [["Marcador", "Valor", "Unidade", "Referência", "Status"], ...markers.map((m) => {
          const r = rec(m);
          return [r.name, r.value, r.unit, r.reference, r.status].map(String);
        })]
      : [["Campo", "Valor"], ["Resumo", String(output.summary ?? "")]];
    const csv = rows.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${def?.slug ?? "eccopet"}-${executionId.slice(0, 8)}.csv`;
    a.click();
  }

  return (
    <div className="space-y-3">
      {artifact.pdf === "FAILED" ? (
        <p className="text-sm text-[var(--ep-fg-muted)]" role="status">
          Análise concluída. Não conseguimos gerar o PDF. Tentar novamente pelo botão abaixo.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <a
            href={`/api/ai-commerce/executions/${executionId}/report`}
            onClick={() => analyticsService.track(AiEvents.ARTIFACT_DOWNLOADED, { screen: "eccopet_workspace", label: executionId })}
          >
            PDF
          </a>
        </Button>
        {def?.hasWorkbook ? (
          <Button asChild variant="outline">
            <a href={`/api/ai-commerce/executions/${executionId}/workbook`}>XLSX</a>
          </Button>
        ) : null}
        <Button variant="outline" onClick={downloadCsv}>
          CSV
        </Button>
        {runtime?.supportsImageOutput ? (
          <Button variant="outline" loading={busyImage} onClick={() => void generateImage()}>
            Gerar visual
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => setProfileOpen(true)}>
          Salvar no Health Profile
        </Button>
      </div>
      {imageUrl ? (
        <figure className="rounded-[18px] border border-[var(--ep-border)] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Conteúdo visual gerado por IA" className="max-h-80 w-full rounded-2xl object-contain" />
          <figcaption className="mt-2 text-xs text-[var(--ep-fg-muted)]">Conteúdo visual gerado por IA — educativo, não é evidência clínica.</figcaption>
        </figure>
      ) : null}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogTitle>O que será adicionado?</DialogTitle>
          <p className="text-sm text-[var(--ep-fg-muted)]">
            Inferências da IA não entram como fato clínico. Você confirma o resumo e os próximos passos como informação relatada.
          </p>
          <ul className="mt-3 list-disc pl-5 text-sm">
            {list(output.summary).map((x) => (
              <li key={x}>{x}</li>
            ))}
            {list(output.nextSteps).slice(0, 4).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => void addToProfile()}>Confirmar</Button>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>
              Cancelar
            </Button>
          </div>
          {profileMsg ? <p className="mt-2 text-sm">{profileMsg}</p> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function NextBestActionCard({ output }: { output: Record<string, unknown> }) {
  const nba = rec(output.nextBestAction);
  if (!nba.href || !nba.label) return null;
  return (
    <section className="rounded-[18px] border border-ecopet-green/30 bg-ecopet-green/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ecopet-green">Próximo passo</p>
      <p className="mt-2 text-lg font-semibold">{String(nba.label)}</p>
      <p className="mt-1 text-sm text-[var(--ep-fg-muted)]">{String(nba.reason ?? "")}</p>
      <Button asChild className="mt-4">
        <Link href={String(nba.href)} onClick={() => analyticsService.track(AiEvents.CROSS_MODULE_ACTION, { screen: "eccopet_workspace", label: String(nba.sku) })}>
          {String(nba.label)}
        </Link>
      </Button>
    </section>
  );
}

export function SpecialistFollowUpChat({
  executionId,
  runtime,
  petName = "seu pet",
}: {
  executionId: string;
  capabilityId: string;
  petId: string;
  runtime?: CapabilityRuntime;
  petName?: string;
}) {
  const followPrompt = (runtime?.followUpPrompt ?? "Quer conversar comigo sobre a análise de {petName}?").replaceAll(
    "{petName}",
    petName
  );
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/ai-commerce/executions/${executionId}/follow-up`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setMessages(d.data.messages ?? []);
      })
      .catch(() => undefined);
  }, [executionId]);

  async function send(message: string) {
    const payload = message.trim();
    if (!payload) return;
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: payload }]);
    setText("");
    analyticsService.track(AiEvents.FOLLOWUP_STARTED, { screen: "eccopet_workspace", label: executionId });
    const res = await fetch(`/api/ai-commerce/executions/${executionId}/follow-up`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: payload }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.success) {
      setMessages((m) => [...m, data.data.message]);
    } else {
      setMessages((m) => [...m, { role: "assistant", content: data.error?.message ?? "Não foi possível responder agora." }]);
    }
  }

  return (
    <section className="rounded-[18px] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5">
      <h3 className="font-semibold">{followPrompt}</h3>
      <p className="mt-1 text-sm text-[var(--ep-fg-muted)]">O chat usa esta análise. Ele não começa do zero.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(runtime?.followUpSuggestions ?? []).map((s) => (
          <button
            key={s}
            type="button"
            className="rounded-full border border-[var(--ep-border)] px-3 py-1 text-xs"
            onClick={() => void send(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto" aria-live="polite">
        {messages.map((m, i) => (
          <p key={`${m.role}-${i}`} className={`rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-ecopet-green/10" : "bg-[var(--ep-bg)]"}`}>
            {m.content}
          </p>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
      >
        <input
          className="flex-1 rounded-full border border-[var(--ep-border)] bg-[var(--ep-bg)] px-4 py-2 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={followPrompt}
          aria-label="Pergunta ao especialista"
        />
        <Button type="submit" loading={busy} disabled={busy}>
          Enviar
        </Button>
      </form>
    </section>
  );
}

export function ModuleResultBody({
  kind,
  output,
  extras,
}: {
  kind: string;
  output: Record<string, unknown>;
  extras?: {
    marketplaceProducts?: Array<{ id: string; name: string; priceInCents: number; available: boolean; sellerName: string; href: string }>;
    weightSeries?: Array<{ label: string; value: number }>;
    examSeries?: Array<{ name: string; points: Array<{ label: string; value: number; unit?: string }> }>;
  };
}) {
  const markers = Array.isArray(output.markers) ? (output.markers as Array<Record<string, unknown>>) : [];
  return (
    <div className="space-y-4">
      {kind === "triage" && (
        <div className="rounded-[18px] border border-[var(--ep-border)] p-4 text-sm">
          <p className="font-medium">O que fazer agora</p>
          <ul className="mt-2 list-disc pl-5">{list(output.nowDo).map((x) => <li key={x}>{x}</li>)}</ul>
          <p className="mt-3 font-medium">O que evitar</p>
          <ul className="mt-2 list-disc pl-5">{list(output.avoid).map((x) => <li key={x}>{x}</li>)}</ul>
          <p className="mt-3 font-medium">Informações para levar</p>
          <ul className="mt-2 list-disc pl-5">{list(output.takeWithYou).map((x) => <li key={x}>{x}</li>)}</ul>
          <Button asChild className="mt-4">
            <Link href="/servicos">Buscar atendimento próximo</Link>
          </Button>
        </div>
      )}
      {kind === "exams" && (
        <div className="overflow-x-auto rounded-[18px] border border-[var(--ep-border)]">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">Marcador</th>
                <th className="p-3">Atual</th>
                <th className="p-3">Referência</th>
                <th className="p-3">Situação</th>
              </tr>
            </thead>
            <tbody>
              {markers.map((m) => (
                <tr key={String(m.name)} className="border-b last:border-0">
                  <td className="p-3">{String(m.name)}</td>
                  <td className="p-3">{String(m.value)} {String(m.unit ?? "")}</td>
                  <td className="p-3">{String(m.reference ?? "indisponível")}</td>
                  <td className="p-3">{String(m.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {kind === "peso" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[18px] border p-4">
            <p className="text-xs text-[var(--ep-fg-muted)]">Peso atual</p>
            <p className="text-xl font-semibold">{String(rec(output.weightMath).currentKg ?? "—")} kg</p>
          </div>
          <div className="rounded-[18px] border p-4">
            <p className="text-xs text-[var(--ep-fg-muted)]">Variação 30d</p>
            <p className="text-xl font-semibold">{String(rec(output.weightMath).delta30dPct ?? "—")}%</p>
          </div>
          <div className="rounded-[18px] border p-4">
            <p className="text-xs text-[var(--ep-fg-muted)]">Tendência</p>
            <p className="text-xl font-semibold">{String(rec(output.weightMath).trend ?? "—")}</p>
          </div>
        </div>
      )}
      {(extras?.weightSeries?.length ?? 0) > 0 && kind === "peso" && (
        <Sparkline title="Peso (kg)" points={extras!.weightSeries!} unit="kg" />
      )}
      {(extras?.examSeries ?? []).slice(0, 4).map((s) => (
        <Sparkline key={s.name} title={s.name} points={s.points} unit={s.points[0]?.unit ?? ""} />
      ))}
      {kind === "vision" && String(output.imageQuality) && (
        <p className="rounded-[18px] border border-[var(--ep-border)] p-4 text-sm">
          Qualidade da imagem: <strong>{String(output.imageQuality)}</strong>
          {output.newPhotoRecommended ? " — precisamos de uma imagem melhor (luz natural, aproxime, sem flash)." : ""}
        </p>
      )}
      {kind === "checkup" && (
        <p className="rounded-[18px] border p-4 text-sm">
          Estado do acompanhamento:{" "}
          {{
            WELL_FOLLOWED: "Bem acompanhado",
            REVIEW_POINTS: "Pontos a revisar",
            INCOMPLETE: "Informações incompletas",
            ATTENTION: "Atenção recomendada",
          }[String(output.accompanimentStatus)] ?? String(output.accompanimentStatus ?? "")}
        </p>
      )}
      {kind === "profile" && output.healthBrief ? (
        <section className="rounded-[18px] border border-ecopet-green/20 p-5">
          <p className="text-xs font-semibold uppercase text-ecopet-green">Health Brief</p>
          <p className="mt-2 text-sm leading-relaxed">{String(output.healthBrief)}</p>
        </section>
      ) : null}
      {list(output.recommendations).length > 0 && (
        <section className="rounded-[18px] border p-4">
          <h3 className="font-semibold">Recomendações</h3>
          <ul className="mt-2 list-disc pl-5 text-sm">{list(output.recommendations).map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      )}
      {list(output.nextSteps).length > 0 && (
        <section className="rounded-[18px] border p-4">
          <h3 className="font-semibold">Próximos passos</h3>
          <ul className="mt-2 list-disc pl-5 text-sm">{list(output.nextSteps).map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      )}
      {list(output.questionsForVeterinarian).length > 0 && (
        <section className="rounded-[18px] border p-4">
          <h3 className="font-semibold">Perguntas para o veterinário</h3>
          <ul className="mt-2 list-disc pl-5 text-sm">{list(output.questionsForVeterinarian).map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
