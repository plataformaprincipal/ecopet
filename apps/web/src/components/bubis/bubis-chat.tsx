"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCapabilityRuntime } from "@/lib/ai-commerce/capability-runtime";
import {
  getSpecialistProtocol,
  initialInterviewInput,
  isInterviewReady,
  shouldInterruptInterview,
} from "@/lib/ai-commerce/specialist-protocols";
import { SmartInputWizard } from "@/components/features/ai-commerce/smart-wizard";
import { AIProgress, ModuleResultBody, UrgencyBanner } from "@/components/features/ai-commerce/workbench-results";
import { mapEmergencyServices, NO_VET_AVAILABLE_COPY } from "@/lib/bubis/map-emergency-services";
import { BubisAvatar } from "./bubis-avatar";

type Pet = { id: string; name: string; species: string; breed: string | null };

const CHIPS = [
  "Dificuldade para respirar",
  "Vômito",
  "Convulsão",
  "Sangramento",
  "Intoxicação",
  "Acidente",
  "Dor",
  "Outro problema",
];

export function BubisChat() {
  const router = useRouter();
  const runtime = getCapabilityRuntime("AI_ECCOVET_TRIAGE");
  const protocol = getSpecialistProtocol("AI_ECCOVET_TRIAGE");
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [petId, setPetId] = useState("");
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [input, setInput] = useState<Record<string, unknown>>({});
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("IDLE");
  const [msg, setMsg] = useState("");
  const [vets, setVets] = useState<ReturnType<typeof mapEmergencyServices> | null>(null);
  const [vetError, setVetError] = useState("");
  const [draft, setDraft] = useState("");
  const [petsError, setPetsError] = useState("");

  const petName = pets?.find((p) => p.id === petId)?.name ?? "seu pet";
  const interrupted = protocol ? shouldInterruptInterview(protocol, input) : false;

  useEffect(() => {
    const ac = new AbortController();
    const timer = window.setTimeout(() => ac.abort(), 12_000);
    fetch("/api/ai-commerce/pets", { credentials: "include", signal: ac.signal })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) {
          setPets([]);
          setPetsError("Entre na sua conta ou cadastre um pet para continuar.");
          return;
        }
        const list = d.data.pets as Pet[];
        setPets(list);
        if (list.length === 1) setPetId(list[0]!.id);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          setPets([]);
          setPetsError("Não foi possível carregar seus pets. Tente novamente.");
          return;
        }
        setPets([]);
        setPetsError("Não foi possível carregar seus pets. Tente novamente.");
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, []);

  const start = useCallback(
    async (chip?: string) => {
      if (!petId) {
        setMsg("Selecione um pet antes de continuar.");
        return;
      }
      setBusy(true);
      setMsg("");
      const res = await fetch("/api/ai-commerce/executions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: "AI_ECCOVET_TRIAGE", petId }),
      });
      const data = await res.json();
      setBusy(false);
      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent("/marketplace/emergencia")}`);
        return;
      }
      if (!data.success) {
        setMsg(data.error?.message ?? "Não foi possível iniciar a triagem.");
        return;
      }
      setExecutionId(data.data.executionId);
      const seeded = initialInterviewInput("AI_ECCOVET_TRIAGE", chip);
      if (Object.keys(seeded).length) {
        setInput(seeded);
        await fetch(`/api/ai-commerce/executions/${data.data.executionId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: seeded }),
        });
      }
    },
    [petId, router]
  );

  async function sendComposer(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    if (!executionId) {
      await start(message);
      return;
    }
    const next = { ...input, ...initialInterviewInput("AI_ECCOVET_TRIAGE", message) };
    setInput(next);
    await fetch(`/api/ai-commerce/executions/${executionId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: next }),
    });
  }

  async function analyze() {
    if (!executionId || busy) return;
    setBusy(true);
    setPhase("ANALYZING");
    await fetch(`/api/ai-commerce/executions/${executionId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    const ac = new AbortController();
    const timer = window.setTimeout(() => ac.abort(), 70_000);
    const res = await fetch(`/api/ai-commerce/executions/${executionId}/analyze`, {
      method: "POST",
      credentials: "include",
      signal: ac.signal,
    }).catch(() => null);
    window.clearTimeout(timer);
    const data = res ? await res.json() : { success: false, error: { message: "A análise demorou além do esperado." } };
    setBusy(false);
    if (!data.success) {
      setPhase("FAILED");
      setMsg(data.error?.message ?? "Não foi possível concluir a triagem.");
      return;
    }
    const loaded = await fetch(`/api/ai-commerce/executions/${executionId}`, { credentials: "include" });
    const loadedJson = await loaded.json();
    setOutput((loadedJson.data?.structuredOutput ?? {}) as Record<string, unknown>);
    setPhase("COMPLETED");
  }

  async function searchVets() {
    setVetError("");
    setVets(null);
    try {
      const res = await fetch("/api/marketplace/services?emergency24h=true&pageSize=8", { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setVets([]);
        setVetError(
          data?.error?.message ??
            "Não foi possível consultar a disponibilidade agora. Tente novamente. Se houver emergência, procure uma clínica presencial."
        );
        return;
      }
      const items = mapEmergencyServices(data.data?.services);
      setVets(items);
      if (!items.length) {
        setVetError(NO_VET_AVAILABLE_COPY);
      }
    } catch {
      setVetError(
        "Não foi possível consultar a disponibilidade agora. Tente novamente. Se houver emergência, procure uma clínica presencial."
      );
      setVets([]);
    }
  }

  const ready = protocol ? isInterviewReady(protocol, input, null) : false;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-3xl flex-col px-4 py-4" data-testid="bubis-chat">
      <header className="flex items-center gap-3 rounded-[20px] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
        <BubisAvatar state={interrupted ? "alert" : busy ? "typing" : "normal"} />
        <div>
          <p className="font-semibold">Bubis</p>
          <p className="text-sm text-[var(--ep-fg-muted)]">Assistente veterinária virtual da EccoPet</p>
          <p className="text-xs text-ecopet-green">● Online · Triagem veterinária por inteligência artificial</p>
        </div>
      </header>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pb-28">
        <div className="rounded-[18px] bg-[var(--ep-bg-elevated)] p-4 text-sm leading-relaxed">
          Olá, eu sou a Bubis, assistente veterinária virtual da EccoPet. Vou fazer uma triagem rápida para entender o que
          está acontecendo com {petName}. Se eu identificar sinais de emergência, vou avisar imediatamente e ajudar você a
          buscar atendimento veterinário. Eu não sou médica-veterinária humana e não possuo CRMV.
        </div>

        {pets && pets.length > 0 ? (
          <select
            className="w-full rounded-2xl border border-[var(--ep-border)] px-3 py-2 text-sm"
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
            aria-label="Pet"
          >
            <option value="">Selecionar pet</option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.breed || p.species}
              </option>
            ))}
          </select>
        ) : pets ? (
          <Button asChild>
            <Link href="/onboarding/pet?callbackUrl=%2Fmarketplace%2Femergencia">Cadastrar pet</Link>
          </Button>
        ) : (
          <p className="text-sm text-[var(--ep-fg-muted)]">{petsError || "Carregando pets…"}</p>
        )}

        {!executionId ? (
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="min-h-11 rounded-full border border-[var(--ep-border)] px-3 py-1.5 text-xs"
                onClick={() => void start(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        ) : null}

        {executionId && runtime && !output ? (
          <SmartInputWizard
            runtime={runtime}
            input={input}
            onChange={setInput}
            onUpload={() => undefined}
            petContext={{ identity: { name: petName } }}
            stepIndex={0}
            onStepIndex={() => undefined}
          />
        ) : null}

        {interrupted ? (
          <div className="rounded-[18px] border border-red-300 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950/40" role="alert">
            <p className="font-semibold">Atendimento urgente recomendado</p>
            <p className="mt-1">Os sinais informados podem exigir avaliação veterinária imediata.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => void searchVets()}>Falar com veterinário</Button>
              <Button variant="outline" onClick={() => void searchVets()}>
                Encontrar atendimento presencial
              </Button>
              <Button variant="outline" onClick={() => void analyze()}>
                Continuar com Bubis
              </Button>
            </div>
          </div>
        ) : null}

        {output ? (
          <div className="space-y-4">
            <UrgencyBanner output={output} />
            <ModuleResultBody kind="triage" output={output} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void searchVets()}>Falar com veterinário</Button>
              <Button asChild variant="outline">
                <Link href="/marketplace/servicos?emergency24h=true">Encontrar atendimento presencial</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {vets && vets.length > 0 ? (
          <ul className="space-y-2">
            {vets.map((vet) => (
              <li key={vet.id} className="rounded-2xl border border-[var(--ep-border)] p-3 text-sm">
                <p className="font-medium">{vet.name}</p>
                <p className="text-[var(--ep-fg-muted)]">
                  {[vet.partnerName, vet.location, vet.modality].filter(Boolean).join(" · ")}
                  {vet.verified ? " · parceiro verificado" : ""}
                </p>
                {vet.crmv ? (
                  <p className="mt-1 text-xs">CRMV {vet.crmv}</p>
                ) : null}
                {vet.specialty ? <p className="text-xs">{vet.specialty}</p> : null}
                {vet.openToday === true ? (
                  <p className="mt-1 text-xs text-ecopet-green">Agenda do parceiro indica aberto hoje</p>
                ) : null}
                {vet.price != null ? (
                  <p className="mt-1">{vet.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                ) : null}
                <Button asChild size="sm" className="mt-2">
                  <Link href={vet.href}>Ver atendimento</Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        {vetError ? (
          <p className="text-sm text-[var(--ep-fg-muted)]" role="status">
            {vetError}
          </p>
        ) : null}
        {phase !== "IDLE" && phase !== "FAILED" && !output ? <AIProgress phase={phase} /> : null}
        {msg ? (
          <p className="text-sm text-red-600" role="alert">
            {msg}
          </p>
        ) : null}
      </div>

      {!output ? (
        <div className="sticky bottom-20 z-20 space-y-2 bg-[var(--ep-bg)]/95 pb-1 backdrop-blur-sm sm:bottom-4">
          {executionId ? (
            <Button className="w-full" loading={busy} disabled={busy || !ready} onClick={() => void analyze()}>
              Gerar classificação de urgência
            </Button>
          ) : null}
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const text = draft.trim();
              if (!text || busy) return;
              setDraft("");
              void sendComposer(text);
            }}
          >
            <input
              className="min-h-11 flex-1 rounded-full border border-[var(--ep-border)] bg-[var(--ep-bg)] px-4 text-sm"
              placeholder="Descreva o que está acontecendo agora…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Mensagem para a Bubis"
              data-testid="bubis-composer"
            />
            <Button type="submit" aria-label="Enviar" disabled={busy}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
