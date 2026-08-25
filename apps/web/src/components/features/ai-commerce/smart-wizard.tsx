"use client";

import { useMemo, useState } from "react";
import { Chip } from "@/components/ui/chip";
import { Progress } from "@/components/ui/progress";
import type { CapabilityRuntime } from "@/lib/ai-commerce/capability-runtime";
import {
  getSpecialistProtocol,
  inferAffectedSystem,
  interviewTranscript,
  isInterviewReady,
  nextInterviewQuestion,
  petNameFromContext,
  shouldInterruptInterview,
  type InterviewQuestion,
} from "@/lib/ai-commerce/specialist-protocols";

type Props = {
  runtime: CapabilityRuntime;
  input: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  onUpload: (files: FileList | null, type: "vision" | "lab") => void;
  petContext: Record<string, unknown> | null;
  stepIndex: number;
  onStepIndex: (n: number) => void;
  ready?: boolean;
};

function formatAnswer(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(", ");
  return String(value ?? "");
}

function QuestionControl({
  question,
  draft,
  setDraft,
  onCommit,
  onUpload,
}: {
  question: InterviewQuestion;
  draft: string;
  setDraft: (v: string) => void;
  onCommit: (value: unknown) => void;
  onUpload: (files: FileList | null, type: "vision" | "lab") => void;
}) {
  if (question.type === "chips" || question.type === "confirm") {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {(question.options ?? []).map((opt) => (
          <Chip key={opt} selected={false} onClick={() => onCommit(opt)}>
            {opt}
          </Chip>
        ))}
      </div>
    );
  }
  if (question.type === "checkboxes") {
    return (
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {(question.options ?? []).map((opt) => (
          <label key={opt} className="flex min-h-11 items-center gap-2 rounded-[16px] border border-[var(--ep-border)] px-3 text-sm">
            <input
              type="checkbox"
              checked={draft.split("|").includes(opt)}
              onChange={() => {
                const selected = draft ? draft.split("|").filter(Boolean) : [];
                const next = selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt];
                setDraft(next.join("|"));
              }}
            />
            {opt}
          </label>
        ))}
        <button
          type="button"
          className="mt-1 rounded-full bg-ecopet-green px-4 py-2 text-sm text-white"
          onClick={() => onCommit(draft.split("|").filter(Boolean))}
        >
          Continuar
        </button>
      </div>
    );
  }
  if (question.type === "upload") {
    return (
      <div className="mt-3 space-y-3">
        {question.slots ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {question.slots.map((slot) => (
              <label key={slot} className="rounded-[16px] border border-dashed border-[var(--ep-border)] p-3 text-center text-sm">
                <span className="font-medium">{slot}</span>
                <input
                  className="mt-2 w-full text-xs"
                  type="file"
                  accept={question.accept}
                  onChange={(e) => onUpload(e.target.files, question.uploadKind ?? "vision")}
                />
              </label>
            ))}
          </div>
        ) : (
          <input
            className="block w-full text-sm"
            type="file"
            accept={question.accept}
            multiple={question.multiple}
            onChange={(e) => onUpload(e.target.files, question.uploadKind ?? "lab")}
          />
        )}
        <div className="flex flex-wrap gap-2">
          <Chip selected={false} onClick={() => onCommit("enviado")}>
            Já enviei
          </Chip>
          <Chip selected={false} onClick={() => onCommit("sem arquivo")}>
            Seguir sem arquivo
          </Chip>
        </div>
      </div>
    );
  }
  const isArea = question.type === "textarea";
  return (
    <div className="mt-3">
      {isArea ? (
        <textarea
          className="min-h-24 w-full rounded-[16px] border border-[var(--ep-border)] bg-[var(--ep-bg)] p-3 text-[var(--ep-fg)]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escreva aqui"
        />
      ) : (
        <input
          className="w-full rounded-[16px] border border-[var(--ep-border)] bg-[var(--ep-bg)] px-3 py-2 text-[var(--ep-fg)]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      )}
      <button
        type="button"
        className="mt-3 rounded-full bg-ecopet-green px-4 py-2 text-sm text-white disabled:opacity-40"
        disabled={!draft.trim()}
        onClick={() => onCommit(draft.trim())}
      >
        Enviar
      </button>
    </div>
  );
}

export function SmartInputWizard({ runtime, input, onChange, onUpload, petContext }: Props) {
  const protocol = getSpecialistProtocol(runtime.sku);
  const petName = petNameFromContext(petContext, "seu pet");
  const [draft, setDraft] = useState("");

  const question = useMemo(
    () => (protocol ? nextInterviewQuestion(protocol, input, petContext) : null),
    [protocol, input, petContext]
  );
  const transcript = useMemo(
    () => (protocol ? interviewTranscript(protocol, input, petContext) : []),
    [protocol, input, petContext]
  );
  const ready = protocol ? isInterviewReady(protocol, input, petContext) : false;
  const interrupted = protocol ? shouldInterruptInterview(protocol, input) : false;
  const answeredCount = transcript.length;
  const totalHint = protocol ? Math.max(protocol.minimumData.length, 4) : 4;
  const pct = ready ? 100 : Math.min(90, (answeredCount / totalHint) * 100);

  function commit(id: string, value: unknown) {
    const next: Record<string, unknown> = { ...input, [id]: value };
    if (id === "chiefComplaint" && typeof value === "string" && !next.affectedSystem) {
      const inferred = inferAffectedSystem(value);
      if (inferred) next.affectedSystem = inferred;
    }
    setDraft("");
    onChange(next);
  }

  function handleUpload(files: FileList | null, type: "vision" | "lab") {
    onUpload(files, type);
    if (!question || question.type !== "upload") return;
    commit(question.id, files && files.length ? `enviado:${files[0].name}` : "enviado");
  }

  if (!protocol) {
    return <p className="text-sm text-[var(--ep-fg-muted)]">Protocolo do especialista indisponível.</p>;
  }

  const intro = protocol.intro.replaceAll("{petName}", petName);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ecopet-green">Entrevista com Dr. Ecco</p>
        <Progress className="mt-2" value={pct} label="Progresso da anamnese" />
      </div>

      <section className="space-y-3 rounded-[18px] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5">
        <div className="rounded-[16px] bg-[var(--ep-bg)] p-3 text-sm leading-relaxed text-[var(--ep-fg)]">
          <p className="text-xs font-medium text-ecopet-green">{runtime.specialistTitle ?? "Dr. Ecco"}</p>
          <p className="mt-1">{intro}</p>
        </div>

        {transcript.map((row) => (
          <div key={row.id} className="space-y-2">
            <div className="rounded-[16px] bg-[var(--ep-bg)] p-3 text-sm">
              <p className="text-xs text-[var(--ep-fg-muted)]">Dr. Ecco</p>
              <p className="mt-1">{row.prompt}</p>
            </div>
            <div className="ml-8 rounded-[16px] bg-ecopet-green/10 p-3 text-sm">
              <p className="text-xs text-[var(--ep-fg-muted)]">Você</p>
              <p className="mt-1">{formatAnswer(row.answer)}</p>
            </div>
          </div>
        ))}

        {interrupted ? (
          <p className="rounded-[16px] border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            Sinal de atenção identificado em {petName}. Não vou alongar a entrevista — já tenho o suficiente para classificar a urgência.
          </p>
        ) : null}

        {question && !interrupted ? (
          <div className="rounded-[16px] bg-[var(--ep-bg)] p-3 text-sm">
            <p className="text-xs text-[var(--ep-fg-muted)]">Dr. Ecco</p>
            <p className="mt-1 font-medium">{question.prompt}</p>
            {question.helper ? <p className="mt-1 text-[var(--ep-fg-muted)]">{question.helper}</p> : null}
            <QuestionControl
              question={question}
              draft={draft}
              setDraft={setDraft}
              onCommit={(value) => commit(question.id, value)}
              onUpload={handleUpload}
            />
          </div>
        ) : null}

        {ready ? (
          <p className="text-sm text-[var(--ep-fg)]">
            {interrupted
              ? `Tenho o sinal necessário para classificar a urgência de ${petName} agora.`
              : `Já tenho o mínimo para analisar ${petName}. Você pode gerar o resultado ou continuar a conversa.`}
          </p>
        ) : null}
      </section>
    </div>
  );
}
