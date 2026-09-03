"use client";

import { Camera, FileUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProductDefBySku } from "@/lib/ai-commerce/catalog";
import { getSpecialistExperience } from "@/lib/ai-commerce/specialist-experience";
import { SpecialistQuickChips } from "./specialist-product-shell";

const CHECKUP_ITEMS = [
  "Peso",
  "Vacinas",
  "Dental",
  "Nutrição",
  "Comportamento",
  "Exames",
  "Atividade",
  "Medicamentos",
  "Consultas",
];

const REPORT_TYPES = ["Saúde", "Histórico", "Consulta", "Viagem", "Para veterinário"];

const VACCINE_LANES = [
  { label: "Realizadas", mark: "✓" },
  { label: "Próximas", mark: "!" },
  { label: "Atrasadas", mark: "⚠" },
];

export function SpecialistStartSurface({
  sku,
  pet,
  draft,
  onDraft,
  onStart,
}: {
  sku: string;
  pet?: { name: string; weight?: number | null; species?: string; breed?: string | null } | null;
  draft: string;
  onDraft: (value: string) => void;
  onStart: (chip?: string) => void;
}) {
  const def = getProductDefBySku(sku);
  const experience = getSpecialistExperience(sku);
  const kind = def?.workspaceKind;

  return (
    <div className="space-y-4" data-testid={`specialist-start-${kind ?? "unknown"}`}>
      {kind === "triage" ? (
        <div className="rounded-[20px] border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm font-medium">Tempo estimado: 2–4 min</p>
          <p className="mt-1 text-sm text-[var(--ep-fg-muted)]">
            Prioriza respiração, consciência, hemorragia, convulsão, trauma e intoxicação. Red flag interrompe na hora.
          </p>
          <Button className="mt-4 w-full bg-red-600 hover:bg-red-700 sm:w-auto" onClick={() => onStart("Iniciar triagem")}>
            Iniciar triagem
          </Button>
        </div>
      ) : null}

      {kind === "report" ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {REPORT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className="min-h-14 rounded-2xl border border-[var(--ep-border)] px-3 py-3 text-sm font-medium hover:border-ecopet-green"
              onClick={() => onStart(type)}
            >
              {type}
            </button>
          ))}
        </div>
      ) : null}

      {kind === "exams" ? (
        <button
          type="button"
          className="flex min-h-40 w-full flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[var(--ep-border)] p-6 text-center"
          onClick={() => onStart()}
        >
          <FileUp className="h-8 w-8 text-ecopet-green" />
          <p className="mt-3 font-semibold">Envie o exame do seu pet</p>
          <p className="mt-1 text-sm text-[var(--ep-fg-muted)]">PDF, JPG ou PNG. A análise começa depois do pet selecionado.</p>
        </button>
      ) : null}

      {kind === "vision" ? (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="rounded-2xl border p-4 text-sm" onClick={() => onStart()}>
            <Camera className="mb-2 h-5 w-5" /> Câmera / upload
          </button>
          <p className="rounded-2xl border border-dashed p-4 text-sm text-[var(--ep-fg-muted)]">
            Escolha a região abaixo. Sem diagnóstico conclusivo.
          </p>
        </div>
      ) : null}

      {kind === "nutri" && pet ? (
        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-2xl border p-3">
            <dt className="text-[var(--ep-fg-muted)]">Peso</dt>
            <dd className="font-semibold">{pet.weight ? `${pet.weight} kg` : "—"}</dd>
          </div>
          <div className="rounded-2xl border p-3">
            <dt className="text-[var(--ep-fg-muted)]">Espécie</dt>
            <dd className="font-semibold">{pet.species}</dd>
          </div>
          <div className="rounded-2xl border p-3">
            <dt className="text-[var(--ep-fg-muted)]">Raça</dt>
            <dd className="font-semibold">{pet.breed ?? "—"}</dd>
          </div>
          <div className="rounded-2xl border p-3">
            <dt className="text-[var(--ep-fg-muted)]">Cálculo</dt>
            <dd className="font-semibold">RER / MER no servidor</dd>
          </div>
        </dl>
      ) : null}

      {kind === "peso" ? (
        <div className="rounded-[20px] border p-4">
          <p className="text-sm font-medium">Gráfico de peso</p>
          <p className="mt-1 text-sm text-[var(--ep-fg-muted)]">
            {pet?.weight ? `Último registro informado: ${pet.weight} kg. A série histórica entra na análise.` : "Registre o peso atual para ver tendência."}
          </p>
        </div>
      ) : null}

      {kind === "vaccine" ? (
        <div className="grid grid-cols-3 gap-2">
          {VACCINE_LANES.map((lane) => (
            <div key={lane.label} className="rounded-2xl border p-3 text-center text-sm">
              <p className="text-lg">{lane.mark}</p>
              <p className="mt-1 font-medium">{lane.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {kind === "checkup" ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CHECKUP_ITEMS.map((item) => (
            <li key={item} className="rounded-2xl border px-3 py-2 text-sm">
              {item}
            </li>
          ))}
        </ul>
      ) : null}

      {kind === "profile" ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {["Saúde", "Vacinas", "Peso", "Nutrição", "Exames", "Medicamentos", "Comportamento", "Consultas", "Relatórios", "IA"].map(
            (card) => (
              <div key={card} className="rounded-2xl border px-3 py-3 text-center text-xs font-medium">
                {card}
              </div>
            )
          )}
        </div>
      ) : null}

      <SpecialistQuickChips sku={sku} onPick={onStart} />

      <form
        className="sticky bottom-20 z-20 flex items-end gap-2 sm:bottom-4"
        onSubmit={(e) => {
          e.preventDefault();
          onStart(draft.trim() || undefined);
        }}
      >
        <input
          className="min-h-11 flex-1 rounded-full border border-[var(--ep-border)] bg-[var(--ep-bg)] px-4 text-sm"
          placeholder={experience?.composerPlaceholder ?? "Escrever mensagem…"}
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          aria-label="Mensagem para o especialista"
          data-testid="specialist-composer"
        />
        <Button type="submit" aria-label="Enviar">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
