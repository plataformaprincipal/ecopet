"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErpChartView } from "./erp-charts";
import { adminFetch } from "@/lib/admin/client-api";
import type { ErpAssistantResponse } from "@/lib/admin/erp/types";
import { AdminMetricGrid } from "../ui/admin-metric-card";
import { Bot, X } from "lucide-react";

const SUGGESTIONS = [
  "Qual foi nossa receita este mês?",
  "Qual parceiro mais vendeu?",
  "Existe alguma fraude?",
  "Mostre o fluxo de caixa.",
  "Quais integrações falharam?",
];

export function ErpAssistantDrawer() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ErpAssistantResponse | null>(null);
  const [error, setError] = useState("");

  async function ask(question: string) {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch<ErpAssistantResponse>("/api/admin/erp/assistant", {
        method: "POST",
        body: JSON.stringify({ question }),
      });
      setResult(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="hidden sm:flex">
        <Bot className="mr-1 h-4 w-4" />
        Assistente IA
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl dark:bg-gray-950">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="font-semibold">Assistente Executivo EcoPet</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (q.trim()) void ask(q.trim());
                }}
                className="flex gap-2"
              >
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pergunte sobre a operação…" />
                <Button type="submit" disabled={loading}>
                  {loading ? "…" : "Perguntar"}
                </Button>
              </form>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
                    onClick={() => {
                      setQ(s);
                      void ask(s);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {result && (
                <div className="space-y-4 rounded-xl border p-4">
                  <p className="text-sm">{result.answer}</p>
                  {result.kpis && result.kpis.length > 0 && (
                    <AdminMetricGrid items={result.kpis.map((k) => ({ label: k.label, value: k.value }))} columns={2} />
                  )}
                  {result.charts?.map((c) => (
                    <ErpChartView key={c.id} chart={c} />
                  ))}
                  <p className="text-xs text-muted-foreground">Fontes: {result.sources.join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
