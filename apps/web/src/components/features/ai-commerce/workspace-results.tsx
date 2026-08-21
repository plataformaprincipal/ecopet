"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { URGENCY_LABELS, getProductDefBySku } from "@/lib/ai-commerce/catalog";
import { analyticsService } from "@/lib/analytics/service";
import { AiEvents } from "@/lib/analytics/events";
import { Sparkline } from "./sparkline";

type Hit = {
  id: string;
  name: string;
  priceInCents: number;
  available: boolean;
  sellerName: string;
  href: string;
};

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : value == null ? [] : [String(value)];
}

function Block({ title, body, items }: { title: string; body?: string; items?: string[] }) {
  return (
    <section className="rounded-2xl border border-black/5 p-4 dark:border-white/10">
      <h3 className="font-semibold">{title}</h3>
      {body && <p className="mt-2 text-sm leading-relaxed">{body}</p>}
      {items && items.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Downloads({ executionId, sku }: { executionId: string; sku: string }) {
  const def = getProductDefBySku(sku);
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild>
        <a href={`/api/ai-commerce/executions/${executionId}/report`} onClick={() => analyticsService.track(AiEvents.REPORT_DOWNLOADED, { screen: "eccopet_workspace", label: executionId })}>
          Baixar PDF
        </a>
      </Button>
      {def?.hasWorkbook ? (
        <Button asChild variant="outline">
          <a href={`/api/ai-commerce/executions/${executionId}/workbook`}>Baixar planilha</a>
        </Button>
      ) : null}
      <Button asChild variant="outline">
        <a href={def?.href ?? "/eccopet"} onClick={() => analyticsService.track(AiEvents.REPURCHASE, { screen: "eccopet_workspace" })}>
          {def?.billingType === "SUBSCRIPTION" ? "Renovar plano" : "Nova análise"}
        </a>
      </Button>
    </div>
  );
}

function Feedback({ executionId }: { executionId: string }) {
  const [done, setDone] = useState(false);
  if (done) return <p className="text-sm text-muted-foreground">Obrigado pelo retorno.</p>;
  return (
    <div className="text-sm">
      <p className="font-medium">Este resultado foi útil?</p>
      <div className="mt-2 flex gap-2">
        {["Sim", "Não"].map((label) => (
          <Button
            key={label}
            size="sm"
            variant="outline"
            onClick={() => {
              fetch(`/api/ai-commerce/executions/${executionId}/feedback`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ helpful: label === "Sim" }),
              }).finally(() => setDone(true));
            }}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function SpecializedResult({
  kind,
  output,
  executionId,
  sku,
  extras,
}: {
  kind: string;
  output: Record<string, unknown>;
  executionId: string;
  sku: string;
  extras?: {
    marketplaceProducts?: Hit[];
    weightSeries?: Array<{ label: string; value: number }>;
    examSeries?: Array<{ name: string; points: Array<{ label: string; value: number; unit?: string }> }>;
    previousCheckup?: Record<string, unknown> | null;
  };
}) {
  const urgency = URGENCY_LABELS[String(output.urgencyLevel ?? "")] ?? String(output.urgencyLevel ?? "");

  return (
    <div className="mt-10 space-y-4">
      {kind === "triage" && (
        <div className="rounded-2xl border-2 border-ecopet-green p-6 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Resultado de triagem</p>
          <p className="mt-2 text-2xl font-semibold">{urgency || "Acompanhamento"}</p>
          <p className="mt-2 text-sm text-muted-foreground">{String(output.summary ?? "")}</p>
          <Button asChild className="mt-4">
            <a href="/servicos">Encontrar atendimento</a>
          </Button>
        </div>
      )}

      {kind !== "triage" && (
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Resultado</h2>
          {urgency && <span className="rounded-full border px-3 py-1 text-sm">{urgency}</span>}
        </div>
      )}

      {kind === "assessment" && (
        <>
          <Block title="Resumo do caso" body={String(output.summary ?? "")} />
          <Block title="Histórico considerado" body={String(output.relevantHistory ?? "")} />
          <Block title="Queixa principal" body={String(output.complaint ?? "")} />
          <Block title="Sinais informados" items={list(output.observations)} />
          <Block title="Pontos de atenção" items={list(output.attentionSigns)} />
          <Block title="Possibilidades a considerar" items={list(output.possibleConsiderations)} />
          <Block title="Próximos passos" items={list(output.recommendedNextSteps)} />
          <Block title="O que observar" items={list(output.watchFor)} />
          <Block title="Perguntas para o veterinário" items={list(output.vetQuestions)} />
        </>
      )}

      {kind === "vision" && (
        <>
          <Block title="Qualidade da imagem" body={String(output.imageQuality ?? "")} />
          <Block title="Área visível" body={String(output.visibleRegion ?? output.bodyArea ?? "")} />
          <Block title="Achados visuais" items={list(output.visibleObservations ?? output.visibleFindings)} />
          <Block title="Alterações aparentes" items={list(output.apparentChanges)} />
          <Block title="Sinais de atenção" items={list(output.attentionSigns)} />
          <Block title="Próximos passos" items={list(output.recommendedNextSteps)} />
        </>
      )}

      {kind === "dental" && (
        <>
          <Block title="Resumo visual" body={String(output.summary ?? output.imageQuality ?? "")} />
          <Block title="Achados aparentes" items={list(output.visibleObservations ?? output.visibleFindings)} />
          <Block title="Áreas para observar" items={list(output.apparentChanges)} />
          <p className="text-xs text-muted-foreground">Mapa visual simplificado — não é odontograma clínico oficial.</p>
        </>
      )}

      {kind === "exams" && (
        <ExamTable output={output} series={extras?.examSeries ?? []} />
      )}

      {kind === "nutri" && (
        <>
          <Block title="Resumo nutricional" body={String(output.overview ?? output.summary ?? "")} />
          <Block title="Rotina atual" body={String(output.routine ?? "")} />
          <Block title="Pontos de atenção" items={list(output.followUpPoints ?? output.attentionSigns)} />
          <Block title="Metas" items={list(output.priorities)} />
          <MarketplaceCards products={extras?.marketplaceProducts ?? []} />
        </>
      )}

      {kind === "peso" && (
        <PesoDashboard output={output} series={extras?.weightSeries ?? []} />
      )}

      {kind === "behavior" && (
        <>
          <Block title="Perfil informado" body={String(output.overview ?? output.summary ?? "")} />
          <Block title="Padrões identificados" items={list(output.followUpPoints ?? output.observations)} />
          <Block title="Possíveis gatilhos" items={list(output.priorities)} />
          <Block title="Plano orientativo" items={list(output.nextSteps)} />
          <Sparkline title="Frequência/intensidade relatada" points={(extras?.weightSeries ?? []).map((p) => ({ ...p, unit: "" }))} empty="O check-in semanal alimenta este gráfico." />
        </>
      )}

      {kind === "vaccine" && (
        <>
          <Block title="Carteira" body={String(output.summary ?? output.overview ?? "")} />
          <Block title="Aplicadas / próximas / pendentes" items={list(output.observations ?? output.followUpPoints)} />
          <p className="text-xs text-muted-foreground">Não é certificação oficial. Não inventamos doses.</p>
        </>
      )}

      {kind === "med" && (
        <>
          <Block title="Plano de medicamentos" body={String(output.summary ?? "")} />
          <div className="rounded-2xl border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Hoje</p>
            <p className="mt-2 text-sm">{String(output.routine ?? "Horários organizados a partir do que você informou.")}</p>
          </div>
          <Block title="Observações" items={list(output.watchFor ?? output.recommendedNextSteps)} />
        </>
      )}

      {kind === "checkup" && (
        <>
          <Block title="Visão geral" body={String(output.overview ?? "")} />
          <Block title="Rotina" body={String(output.routine ?? "")} />
          <Block title="Alimentação" body={String(output.feeding ?? "")} />
          <Block title="Prevenção" body={String(output.prevention ?? "")} />
          <Block title="Prioridades" items={list(output.priorities)} />
          {extras?.previousCheckup && (
            <section className="rounded-2xl border p-4 text-sm">
              <h3 className="font-semibold">Check-up atual versus anterior</h3>
              <p className="mt-1 text-muted-foreground">Comparação de acompanhamento — não é diagnóstico clínico.</p>
              {["feeding", "activity", "prevention"].map((key) => (
                <p key={key} className="mt-2">
                  <span className="font-medium capitalize">{key}: </span>
                  {String(output[key] ?? "—")} → anterior: {String(extras.previousCheckup?.[key] ?? "—")}
                </p>
              ))}
            </section>
          )}
        </>
      )}

      {kind === "report" && (
        <>
          <Block title="Objetivo" body={String(output.summary ?? "")} />
          <Block title="Fontes utilizadas" items={list(output.observations)} />
          <Block title="Pontos para acompanhamento" items={list(output.watchFor)} />
          <p className="text-xs text-muted-foreground">Minuta automatizada. Sem assinatura de veterinário.</p>
        </>
      )}

      {kind === "profile" && (
        <>
          <Block title="Dossiê" body={String(output.overview ?? output.summary ?? "")} />
          <Block title="O que acompanhar" items={list(output.followUpPoints ?? output.watchFor)} />
        </>
      )}

      {kind === "triage" && (
        <>
          <Block title="Justificativa" body={String(output.summary ?? "")} />
          <Block title="Sinais observados" items={list(output.observations)} />
          <Block title="Sinais de alarme" items={list(output.attentionSigns)} />
          <Block title="Ação recomendada" items={list(output.recommendedNextSteps)} />
        </>
      )}

      <Block title="Limitações" items={list(output.limitations)} />
      <p className="text-xs text-muted-foreground">
        Resultados automatizados e orientativos. Não é laudo veterinário, atestado, receita ou parecer oficial.
      </p>
      <Downloads executionId={executionId} sku={sku} />
      <Feedback executionId={executionId} />
    </div>
  );
}

function ExamTable({
  output,
  series,
}: {
  output: Record<string, unknown>;
  series: Array<{ name: string; points: Array<{ label: string; value: number; unit?: string }> }>;
}) {
  const markers = Array.isArray(output.markers) ? (output.markers as Array<Record<string, unknown>>) : [];
  return (
    <>
      <Block title="Resumo" body={String(output.summary ?? "")} />
      <div className="overflow-x-auto rounded-2xl border">
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
                <td className="p-3">
                  {String(m.value)} {String(m.unit ?? "")}
                </td>
                <td className="p-3">{String(m.reference ?? "indisponível")}</td>
                <td className="p-3">{String(m.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {series.slice(0, 4).map((s) => (
        <Sparkline key={s.name} title={s.name} points={s.points} unit={s.points[0]?.unit ?? ""} />
      ))}
    </>
  );
}

function PesoDashboard({
  output,
  series,
}: {
  output: Record<string, unknown>;
  series: Array<{ label: string; value: number }>;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border p-4">
          <p className="text-xs text-muted-foreground">Peso atual</p>
          <p className="text-xl font-semibold">{String(output.summary ?? series.at(-1)?.value ?? "—")}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs text-muted-foreground">Tendência</p>
          <p className="text-xl font-semibold">{String(output.routine ?? "—")}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs text-muted-foreground">Meta</p>
          <p className="text-xl font-semibold">{String(output.prevention ?? "—")}</p>
        </div>
      </div>
      <Sparkline title="Peso (kg)" points={series} unit="kg" empty="Registre ao menos dois pesos para o gráfico." />
    </>
  );
}

function MarketplaceCards({ products }: { products: Hit[] }) {
  if (!products.length) {
    return <p className="text-sm text-muted-foreground">Nenhum produto do marketplace encontrado para as palavras da avaliação. Nada foi inventado.</p>;
  }
  return (
    <section>
      <h3 className="font-semibold">Produtos EccoPet compatíveis</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {products.map((p) => (
          <article key={p.id} className="rounded-2xl border p-4">
            <p className="font-medium">{p.name}</p>
            <p className="text-sm">{(p.priceInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            <p className="text-xs text-muted-foreground">{p.sellerName} · {p.available ? "Disponível" : "Sem estoque"}</p>
            <div className="mt-3 flex gap-2">
              <Button asChild size="sm" variant="outline">
                <a href={p.href}>Ver produto</a>
              </Button>
              <Button
                size="sm"
                disabled={!p.available}
                onClick={() => {
                  fetch("/api/cart/items", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId: p.id, quantity: 1 }),
                  });
                }}
              >
                Adicionar ao carrinho
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
