"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getProductDefBySku, getProductDefBySlug } from "@/lib/ai-commerce/catalog";
import { getCapabilityRuntime } from "@/lib/ai-commerce/capability-runtime";
import { getSpecialistProtocol, isInterviewReady, petNameFromContext } from "@/lib/ai-commerce/specialist-protocols";
import { analyticsService } from "@/lib/analytics/service";
import { AiEvents } from "@/lib/analytics/events";
import { PetHealthProfilePanel } from "./health-profile";
import { SmartInputWizard } from "./smart-wizard";
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

function ageLabel(birthDate: string | null | undefined) {
  if (!birthDate) return null;
  const years = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
  return years > 0 ? `${years} anos` : "menos de 1 ano";
}

function ModuleBrief({ sku }: { sku: string }) {
  const runtime = getCapabilityRuntime(sku);
  const def = getProductDefBySku(sku);
  const protocol = getSpecialistProtocol(sku);
  if (!runtime || !def) return null;
  return (
    <header className="rounded-[18px] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ecopet-green">Dr. Ecco · Veterinário Virtual EccoPet</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ep-fg)] sm:text-3xl">
        {protocol?.specialistTitle ?? runtime.specialistTitle ?? def.name}
      </h1>
      <p className="mt-1 text-sm text-[var(--ep-fg-muted)]">Análise assistida por inteligência artificial</p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ep-fg)]">
        {protocol?.commercialValue ?? runtime.description}
      </p>
    </header>
  );
}

function listNames(value: unknown): string {
  if (!Array.isArray(value) || !value.length) return "Não registrado";
  return value
    .map((item) => {
      if (item && typeof item === "object" && "name" in item) return String((item as { name?: unknown }).name ?? "");
      return String(item);
    })
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
}

function PetPanel({ pet, petContext }: { pet: Pet; petContext?: Record<string, unknown> | null }) {
  const health = (petContext?.health ?? {}) as Record<string, unknown>;
  return (
    <aside className="rounded-[18px] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ecopet-green">Pet</p>
      <div className="mt-3 flex items-center gap-3">
        {pet.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pet.photo} alt="" className="h-12 w-12 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ecopet-green/10 text-lg font-semibold">
            {pet.name.slice(0, 1)}
          </div>
        )}
        <div>
          <p className="font-semibold">{pet.name}</p>
          <p className="text-sm text-[var(--ep-fg-muted)]">{pet.breed || pet.species}</p>
        </div>
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--ep-fg-muted)]">Peso</dt>
          <dd>{pet.weight ? `${pet.weight} kg` : "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--ep-fg-muted)]">Idade</dt>
          <dd>{ageLabel(pet.birthDate) ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[var(--ep-fg-muted)]">Alergias</dt>
          <dd className="mt-0.5">{listNames(health.allergies)}</dd>
        </div>
        <div>
          <dt className="text-[var(--ep-fg-muted)]">Medicações</dt>
          <dd className="mt-0.5">{listNames(petContext?.medications)}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function AiWorkspace({ executionId }: { executionId: string }) {
  const [ex, setEx] = useState<Execution | null>(null);
  const [input, setInput] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("IDLE");
  const [msg, setMsg] = useState("");
  const [stepIndex, setStepIndex] = useState(0);

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
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setMsg("Não encontrado.");
      }
    },
    [executionId]
  );

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
    return <p className="p-8 text-sm text-[var(--ep-fg-muted)]">{msg || "Carregando a ferramenta…"}</p>;
  }

  const def = getProductDefBySku(ex.sku);
  const runtime = def ? getCapabilityRuntime(def.sku) : undefined;
  const protocol = getSpecialistProtocol(ex.sku);
  const kind = def?.workspaceKind ?? "assessment";
  const out = ex.structuredOutput;
  const petContext = (ex.extras?.petAIContext ?? null) as Record<string, unknown> | null;
  const canAnalyze = protocol ? isInterviewReady(protocol, input, petContext) : Object.keys(input).length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <p className="text-sm text-[var(--ep-fg-muted)]">
        <Link href="/eccopet" className="text-ecopet-green hover:underline">
          EccoPet AI
        </Link>
        {def ? ` > ${def.name} Grátis · IA` : ""}
      </p>
      <div className="mt-4">
        <ModuleBrief sku={ex.sku} />
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <PetPanel pet={ex.pet} petContext={petContext} />
        <div>
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
              <div className="sticky bottom-4 mt-6">
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
          {busy || (phase !== "IDLE" && phase !== "COMPLETED" && !out) ? <div className="mt-6"><AIProgress phase={phase} /></div> : null}
          {msg && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {msg}
            </p>
          )}
        </div>
      </div>

      {out && (
        <div className="mt-8 space-y-5">
          <UrgencyBanner output={out} />
          <p className="text-base leading-relaxed text-[var(--ep-fg)]">{String(out.clinicalOverview ?? out.summary ?? "")}</p>
          <DiagnosticImpressionCard output={out} />
          <EvidenceTrace output={out} />
          <ModuleResultBody kind={kind} output={out} extras={ex.extras} />
          {kind === "profile" ? <PetHealthProfilePanel petId={ex.pet.id} /> : null}
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
    </div>
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

  useEffect(() => {
    if (def) analyticsService.track(AiEvents.MODULE_OPEN, { screen: `eccopet_${slug}`, label: def.sku });
    fetch("/api/ai-commerce/pets", { credentials: "include" })
      .then(async (r) => ({ status: r.status, json: await r.json() }))
      .then(({ status, json }) => {
        if (json.success) {
          setGuest(false);
          setPets(json.data.pets);
          if (json.data.pets.length === 1) setPetId(json.data.pets[0].id);
        } else {
          setPets([]);
          setGuest(status === 401);
        }
      })
      .catch(() => {
        setPets([]);
        setGuest(true);
      });
  }, [def, slug]);

  async function startTool() {
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
    setBusy(false);
    if (!data.success) {
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
    analyticsService.track(AiEvents.EXECUTION_STARTED, { screen: `eccopet_${slug}`, label: def.sku });
    router.replace(def.workspaceHref(data.data.executionId));
  }

  if (!def || !runtime) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-sm">Ferramenta não encontrada.</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <p className="text-sm text-[var(--ep-fg-muted)]">
        <Link href="/eccopet" className="text-ecopet-green hover:underline">
          EccoPet AI
        </Link>
        {` > ${def.name} Grátis · IA`}
      </p>
      <div className="mt-4">
        <ModuleBrief sku={def.sku} />
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[18px] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
          <p className="text-sm font-medium">Para qual pet?</p>
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
              className="mt-3 w-full rounded-[16px] border border-[var(--ep-border)] bg-[var(--ep-bg)] px-3 py-2"
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
        </aside>
        <section className="rounded-[18px] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5">
          <h2 className="text-lg font-semibold">Como esta ferramenta funciona</h2>
          <ol className="mt-3 space-y-2 text-sm text-[var(--ep-fg-muted)]">
            {runtime.steps.map((s, i) => (
              <li key={s.id}>
                {i + 1}. {s.title}
              </li>
            ))}
          </ol>
          {runtime.quickActions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {runtime.quickActions.map((a) => (
                <span key={a} className="rounded-full border border-[var(--ep-border)] px-3 py-1 text-xs">
                  {a}
                </span>
              ))}
            </div>
          )}
          <Button className="mt-6" loading={busy} disabled={busy} onClick={() => void startTool()}>
            {runtime.ctaLabel ?? def.ctaLabel ?? "Conversar com Dr. Ecco"}
          </Button>
          {msg ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {msg}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
