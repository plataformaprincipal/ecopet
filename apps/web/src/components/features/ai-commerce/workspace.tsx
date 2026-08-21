"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getProductDefBySku } from "@/lib/ai-commerce/catalog";
import { analyticsService } from "@/lib/analytics/service";
import { AiEvents } from "@/lib/analytics/events";
import { SpecializedForm } from "./workspace-forms";
import { SpecializedResult } from "./workspace-results";

type Execution = {
  id: string;
  status: string;
  sku: string;
  capabilityId: string;
  inputSnapshot: Record<string, unknown> | null;
  structuredOutput: Record<string, unknown> | null;
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    birthDate: string | null;
    weight: number | null;
    photo: string | null;
  };
  product: { name: string; slug: string } | null;
  failureCode: string | null;
  extras?: {
    marketplaceProducts?: Array<{
      id: string;
      name: string;
      priceInCents: number;
      available: boolean;
      sellerName: string;
      href: string;
    }>;
    weightSeries?: Array<{ label: string; value: number }>;
    examSeries?: Array<{ name: string; points: Array<{ label: string; value: number; unit?: string }> }>;
    previousCheckup?: Record<string, unknown> | null;
  };
};

export function AiWorkspace({ executionId }: { executionId: string }) {
  const [ex, setEx] = useState<Execution | null>(null);
  const [input, setInput] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/ai-commerce/executions/${executionId}`, {
        credentials: "include",
        signal,
      });
      const data = await res.json();
      if (signal?.aborted) return;
      if (!data.success) {
        setMsg(data.error?.message ?? "Não encontrado.");
        return;
      }
      setEx(data.data);
      if (data.data.inputSnapshot) setInput(data.data.inputSnapshot);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setMsg("Não encontrado.");
    }
  }, [executionId]);

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  async function persist(next: Record<string, unknown>) {
    setInput(next);
    await fetch(`/api/ai-commerce/executions/${executionId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: next }),
    });
  }

  async function analyze() {
    setBusy(true);
    setMsg("");
    await persist(input);
    const res = await fetch(`/api/ai-commerce/executions/${executionId}/analyze`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    setBusy(false);
    if (!data.success) {
      setMsg(data.error?.message ?? "Não conseguimos concluir sua análise agora. Sua utilização não foi consumida.");
      return;
    }
    analyticsService.track(AiEvents.EXECUTION_COMPLETED, { screen: "eccopet_workspace", label: executionId });
    await load();
  }

  async function upload(files: FileList | null, type: "vision" | "lab") {
    if (!files || !ex) return;
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.set("file", file);
      form.set("executionId", executionId);
      form.set("petId", ex.pet.id);
      form.set("type", type);
      const res = await fetch("/api/ai-commerce/upload", { method: "POST", credentials: "include", body: form });
      const data = await res.json();
      if (!data.success) setMsg(data.error?.message ?? "Falha no envio.");
    }
  }

  if (!ex) {
    return <p className="p-8 text-sm text-muted-foreground">{msg || "Carregando…"}</p>;
  }

  const def = getProductDefBySku(ex.sku);
  const kind = def?.workspaceKind ?? "assessment";
  const out = ex.structuredOutput;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/minha-conta/ia" className="text-sm text-ecopet-green hover:underline">
        ← Meus serviços
      </Link>
      <div className="mt-6 flex items-center gap-4">
        {ex.pet.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ex.pet.photo} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ecopet-green/10 text-lg font-semibold">
            {ex.pet.name.slice(0, 1)}
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-wide text-ecopet-green">{def?.tag}</p>
          <h1 className="text-2xl font-semibold">{def?.name ?? ex.product?.name ?? "EccoPet AI"}</h1>
          <p className="text-sm text-muted-foreground">
            {ex.pet.name} · {ex.pet.breed || ex.pet.species}
            {ex.pet.weight ? ` · ${ex.pet.weight} kg` : ""}
          </p>
        </div>
      </div>

      {ex.status !== "COMPLETED" && (
        <div className="mt-8">
          <SpecializedForm kind={kind} input={input} onChange={persist} onUpload={upload} />
          <div className="sticky bottom-4 mt-8">
            <Button className="w-full sm:w-auto" onClick={analyze} loading={busy}>
              Processar
            </Button>
          </div>
        </div>
      )}

      {busy && (
        <div className="mt-8 rounded-2xl border p-6">
          <p className="font-medium">Analisando informações de {ex.pet.name}</p>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>✓ Perfil carregado</li>
            <li>✓ Histórico organizado</li>
            <li>● Processando informações</li>
            <li>○ Preparando resultado</li>
            <li>○ Gerando relatório</li>
          </ul>
        </div>
      )}

      {msg && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {msg}
        </p>
      )}

      {out && (
        <SpecializedResult
          kind={kind}
          output={out}
          executionId={executionId}
          sku={ex.sku}
          extras={ex.extras}
        />
      )}
    </div>
  );
}
