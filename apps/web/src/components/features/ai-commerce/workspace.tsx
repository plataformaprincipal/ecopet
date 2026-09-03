"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getProductDefBySku, getProductDefBySlug } from "@/lib/ai-commerce/catalog";
import { getCapabilityRuntime } from "@/lib/ai-commerce/capability-runtime";
import { getSpecialistProtocol, initialInterviewInput, isInterviewReady, petNameFromContext } from "@/lib/ai-commerce/specialist-protocols";
import { analyticsService } from "@/lib/analytics/service";
import { AiEvents } from "@/lib/analytics/events";
import { PetHealthProfilePanel } from "./health-profile";
import { SmartInputWizard } from "./smart-wizard";
import { SpecialistProductShell } from "./specialist-product-shell";
import { SpecialistStartSurface } from "./specialist-start-surface";
import {
  AIProgress,
  ArtifactActions,
  DiagnosticImpressionCard,
  EvidenceTrace,
  ModuleResultBody,
  NextBestActionCard,
  SpecialistFollowUpChat,
  UrgencyBanner,
} from "./workbench-results";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
  weight?: number | null;
  photo?: string | null;
};

type Execution = {
  id: string;
  status: string;
  sku: string;
  capabilityId: string;
  inputSnapshot: Record<string, unknown> | null;
  structuredOutput: Record<string, unknown> | null;
  pet: Pet;
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
    petAIContext?: Record<string, unknown> | null;
  };
};

export function AiWorkspace({ executionId }: { executionId: string }) {
  const [ex, setEx] = useState<Execution | null>(null);
  const [input, setInput] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("IDLE");
  const [msg, setMsg] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [history, setHistory] = useState<Array<{ id: string; href: string; summary: string; when: string }>>([]);
  const [saved, setSaved] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
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
        if (data.data.status === "COMPLETED") setPhase("COMPLETED");
        if (data.data.status === "FAILED") setPhase("FAILED");
        const sku = data.data.sku as string | undefined;
        const petId = data.data.pet?.id as string | undefined;
        if (sku && petId) {
          const hist = await fetch(`/api/ai-commerce/executions?sku=${encodeURIComponent(sku)}&petId=${encodeURIComponent(petId)}`, {
            credentials: "include",
          });
          const histJson = await hist.json();
          if (histJson.success) {
            const def = getProductDefBySku(sku);
            setHistory(
              (histJson.data.executions as Array<{ id: string; summary: string; completedAt: string }>)
                .filter((row) => row.id !== executionId)
                .map((row) => ({
                  id: row.id,
                  href: def ? def.workspaceHref(row.id) : `/eccopet/vet/session/${row.id}`,
                  summary: row.summary,
                  when: row.completedAt ? new Date(row.completedAt).toLocaleString("pt-BR") : "",
                }))
            );
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setMsg("Não encontrado.");
      }
    },
    [executionId]
  );

  useEffect(() => {
    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      ac.abort();
      setMsg((current) => current || "Não foi possível carregar. Tente novamente.");
    }, 15_000);
    void load(ac.signal).finally(() => window.clearTimeout(timer));
    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
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
    if (busy) return;
    setBusy(true);
    setMsg("");
    setPhase("VALIDATING");
    await persist(input);
    setPhase("ANALYZING");
    analyticsService.track(AiEvents.ANALYSIS_STARTED, { screen: "eccopet_workspace", label: executionId });
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 70000);
    const res = await fetch(`/api/ai-commerce/executions/${executionId}/analyze`, {
      method: "POST",
      credentials: "include",
      signal: ac.signal,
    }).catch(() => null);
    clearTimeout(timer);
    const data = res ? await res.json() : { success: false, error: { code: "ANALYSIS_TIMEOUT", message: "A análise demorou além do esperado." } };
    setBusy(false);
    if (!data.success) {
      setPhase("FAILED");
      analyticsService.track(AiEvents.ANALYSIS_FAILED, { screen: "eccopet_workspace", label: executionId });
      const code = data.error?.code as string | undefined;
      setMsg(
        code === "RATE_LIMIT"
          ? "Você atingiu temporariamente o limite desta ferramenta. Tente novamente mais tarde."
          : data.error?.message ?? "Não foi possível concluir a análise agora. Tente novamente."
      );
      return;
    }
    setPhase("GENERATING_ARTIFACTS");
    analyticsService.track(AiEvents.ANALYSIS_COMPLETED, { screen: "eccopet_workspace", label: executionId });
    await load();
    setPhase("COMPLETED");
  }

  async function upload(files: FileList | null, type: "vision" | "lab") {
    if (!files || !ex) return;
    setPhase("UPLOADING");
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.set("file", file);
      form.set("executionId", executionId);
      form.set("petId", ex.pet.id);
      form.set("type", type);
      const res = await fetch("/api/ai-commerce/upload", { method: "POST", credentials: "include", body: form });
      const data = await res.json();
      if (!data.success) setMsg(data.error?.message ?? "Não conseguimos ler esse arquivo.");
      else analyticsService.track(AiEvents.ATTACHMENT_ADDED, { screen: "eccopet_workspace", label: type });
    }
    setPhase("IDLE");
  }

  if (!ex) {
    return (
      <div className="p-8 text-sm text-[var(--ep-fg-muted)]">
        <p>{msg || "Carregando a ferramenta…"}</p>
        {msg ? (
          <Button className="mt-3" variant="outline" onClick={() => void load()}>
            Tentar novamente
          </Button>
        ) : null}
      </div>
    );
  }

  const def = getProductDefBySku(ex.sku);
  const runtime = def ? getCapabilityRuntime(def.sku) : undefined;
  const protocol = getSpecialistProtocol(ex.sku);
  const kind = def?.workspaceKind ?? "assessment";
  const out = ex.structuredOutput;
  const petContext = (ex.extras?.petAIContext ?? null) as Record<string, unknown> | null;
  const canAnalyze = protocol ? isInterviewReady(protocol, input, petContext) : Object.keys(input).length > 0;

  return (
    <SpecialistProductShell sku={ex.sku} pet={ex.pet} petContext={petContext} history={history}>
      <p className="mb-3 text-sm text-[var(--ep-fg-muted)]">
        <Link href="/eccopet" className="text-ecopet-green hover:underline">
          EccoPet AI
        </Link>
        {def ? ` › ${def.name}` : ""}
      </p>
      {ex.status !== "COMPLETED" && runtime && (
        <>
          <SmartInputWizard
            runtime={runtime}
            input={input}
            onChange={(next) => void persist(next)}
            onUpload={upload}
            petContext={petContext}
            stepIndex={stepIndex}
            onStepIndex={setStepIndex}
          />
          <div className="sticky bottom-20 z-20 mt-6 sm:bottom-4">
            <Button
              className="w-full sm:w-auto"
              onClick={() => void analyze()}
              loading={busy}
              disabled={busy || !canAnalyze}
            >
              Gerar análise de {petNameFromContext(petContext, ex.pet.name)}
            </Button>
          </div>
        </>
      )}
      {busy || (phase !== "IDLE" && phase !== "COMPLETED" && phase !== "FAILED" && !out) ? (
        <div className="mt-6">
          <AIProgress phase={phase} />
        </div>
      ) : null}
      {msg && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {msg}
        </p>
      )}
      {out && (
        <div className="mt-8 space-y-5" data-testid="specialist-result">
          <UrgencyBanner output={out} />
          <p className="text-base leading-relaxed text-[var(--ep-fg)]">{String(out.clinicalOverview ?? out.summary ?? "")}</p>
          <DiagnosticImpressionCard output={out} />
          <EvidenceTrace output={out} />
          <ModuleResultBody kind={kind} output={out} extras={ex.extras} />
          {kind === "profile" ? <PetHealthProfilePanel petId={ex.pet.id} /> : null}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                const res = await fetch(`/api/ai-commerce/executions/${executionId}/add-to-profile`, {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ items: [String(out.summary ?? out.clinicalOverview ?? "Análise")] }),
                });
                const data = await res.json();
                setSaved(Boolean(data.success));
                if (!data.success) setMsg(data.error?.message ?? "Não foi possível salvar no perfil.");
              }}
            >
              {saved ? "Salvo no perfil" : "Salvar no perfil"}
            </Button>
            {kind === "triage" ? (
              <Button asChild>
                <Link href="/marketplace/emergencia">Fazer triagem / Emergência</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/marketplace/servicos?emergency24h=true">Encontrar veterinário</Link>
            </Button>
          </div>
          <ArtifactActions executionId={executionId} sku={ex.sku} output={out} runtime={runtime} />
          <NextBestActionCard output={out} />
          <SpecialistFollowUpChat
            executionId={executionId}
            capabilityId={ex.capabilityId}
            petId={ex.pet.id}
            runtime={runtime}
            petName={ex.pet.name}
          />
        </div>
      )}
    </SpecialistProductShell>
  );
}

export function AiWorkbench({ slug }: { slug: string }) {
  const router = useRouter();
  const def = useMemo(() => getProductDefBySlug(slug), [slug]);
  const runtime = def ? getCapabilityRuntime(def.sku) : undefined;
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [petId, setPetId] = useState("");
  const [guest, setGuest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (def) analyticsService.track(AiEvents.MODULE_OPEN, { screen: `eccopet_${slug}`, label: def.sku });
    const ac = new AbortController();
    const timer = window.setTimeout(() => ac.abort(), 12_000);
    fetch("/api/ai-commerce/pets", { credentials: "include", signal: ac.signal })
      .then(async (r) => ({ status: r.status, json: await r.json() }))
      .then(({ status, json }) => {
        if (json.success) {
          setGuest(false);
          setPets(json.data.pets);
          if (json.data.pets.length === 1) setPetId(json.data.pets[0].id);
        } else {
          setPets([]);
          setGuest(status === 401);
          if (status >= 500) setMsg("Não foi possível carregar seus pets. Tente novamente.");
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          setPets([]);
          setMsg("Não foi possível carregar seus pets. Tente novamente.");
          return;
        }
        setPets([]);
        setGuest(true);
        setMsg("Não foi possível carregar seus pets. Tente novamente.");
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [def, slug]);

  async function startTool(firstMessage?: string) {
    if (!def) return;
    if (!pets || pets.length === 0) {
      if (guest) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/eccopet/${slug}`)}`);
        return;
      }
      router.push(`/onboarding/pet?callbackUrl=${encodeURIComponent(`/eccopet/${slug}`)}`);
      return;
    }
    if (!petId) {
      setMsg("Selecione um pet antes de continuar.");
      return;
    }
    setBusy(true);
    setMsg("");
    analyticsService.track(AiEvents.PET_SELECTED, { screen: `eccopet_${slug}`, label: petId });
    const res = await fetch("/api/ai-commerce/executions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku: def.sku, petId }),
    });
    const data = await res.json();
    if (!data.success) {
      setBusy(false);
      const code = data.error?.code as string | undefined;
      if (code === "AUTH_REQUIRED" || res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/eccopet/${slug}`)}`);
        return;
      }
      if (code === "RATE_LIMIT") {
        setMsg("Você atingiu temporariamente o limite desta ferramenta.");
        return;
      }
      if (code === "PET_FORBIDDEN") {
        setMsg("Selecione um pet antes de continuar.");
        return;
      }
      setMsg(data.error?.message ?? "Esta ferramenta está temporariamente indisponível.");
      return;
    }
    const executionId = data.data.executionId as string;
    const seeded = initialInterviewInput(def.sku, firstMessage ?? draft);
    if (Object.keys(seeded).length) {
      await fetch(`/api/ai-commerce/executions/${executionId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: seeded }),
      });
    }
    analyticsService.track(AiEvents.EXECUTION_STARTED, { screen: `eccopet_${slug}`, label: def.sku });
    router.replace(def.workspaceHref(executionId));
  }

  const selectedPet = pets?.find((p) => p.id === petId) ?? pets?.[0] ?? null;

  if (!def || !runtime) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-sm">Ferramenta não encontrada.</div>;
  }

  return (
    <SpecialistProductShell sku={def.sku} pet={selectedPet}>
      <p className="mb-3 text-sm text-[var(--ep-fg-muted)]">
        <Link href="/eccopet" className="text-ecopet-green hover:underline">
          EccoPet AI
        </Link>
        {` › ${def.name}`}
      </p>
      <label className="block text-sm font-medium">Para qual pet?</label>
      {pets === null && <p className="mt-2 text-sm text-[var(--ep-fg-muted)]">Carregando pets…</p>}
      {pets && pets.length === 0 && (
        <div className="mt-3">
          <p className="text-sm">Cadastre um pet para usar a ferramenta.</p>
          <Button asChild className="mt-3">
            <Link href={`/onboarding/pet?callbackUrl=${encodeURIComponent(`/eccopet/${slug}`)}`}>Cadastrar pet</Link>
          </Button>
        </div>
      )}
      {pets && pets.length > 0 && (
        <select
          className="mt-3 w-full max-w-md rounded-[16px] border border-[var(--ep-border)] bg-[var(--ep-bg)] px-3 py-2"
          value={petId}
          onChange={(e) => setPetId(e.target.value)}
          aria-label="Para qual pet?"
        >
          <option value="">Selecionar</option>
          {pets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.breed || p.species}
            </option>
          ))}
        </select>
      )}
      <SpecialistStartSurface
        sku={def.sku}
        pet={selectedPet}
        draft={draft}
        onDraft={setDraft}
        onStart={(chip) => void startTool(chip)}
      />
      <div className="mt-4">
        <Button className="w-full sm:w-auto" loading={busy} disabled={busy} onClick={() => void startTool(draft || undefined)}>
          {runtime.ctaLabel ?? def.ctaLabel ?? "Conversar com Dr. Ecco"}
        </Button>
      </div>
      {msg ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {msg}
        </p>
      ) : null}
    </SpecialistProductShell>
  );
}
