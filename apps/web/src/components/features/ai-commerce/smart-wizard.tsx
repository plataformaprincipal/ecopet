"use client";

import { Chip } from "@/components/ui/chip";
import { Progress } from "@/components/ui/progress";
import type { CapabilityRuntime, WizardField, WizardStep } from "@/lib/ai-commerce/capability-runtime";
import { visibleWizardSteps } from "@/lib/ai-commerce/capability-runtime";

type Props = {
  runtime: CapabilityRuntime;
  input: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  onUpload: (files: FileList | null, type: "vision" | "lab") => void;
  petContext: Record<string, unknown> | null;
  stepIndex: number;
  onStepIndex: (n: number) => void;
};

function FieldControl({
  field,
  value,
  input,
  onChange,
}: {
  field: WizardField;
  value: unknown;
  input: Record<string, unknown>;
  onChange: (id: string, v: unknown) => void;
}) {
  if (field.showIf) {
    const current = input[field.showIf.field];
    if (field.showIf.equals != null && String(current) !== field.showIf.equals) return null;
    if (field.showIf.truthy && !current) return null;
  }
  if (field.type === "textarea") {
    return (
      <label className="block text-sm">
        <span className="font-medium text-[var(--ep-fg)]">{field.label}</span>
        <textarea
          className="mt-1 min-h-24 w-full rounded-[16px] border border-[var(--ep-border)] bg-[var(--ep-bg)] p-3 text-[var(--ep-fg)]"
          value={String(value ?? "")}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      </label>
    );
  }
  if (field.type === "chips") {
    return (
      <fieldset>
        <legend className="text-sm font-medium text-[var(--ep-fg)]">{field.label}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => (
            <Chip key={opt} selected={String(value ?? "") === opt} onClick={() => onChange(field.id, opt)}>
              {opt}
            </Chip>
          ))}
        </div>
      </fieldset>
    );
  }
  if (field.type === "checkboxes") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset>
        <legend className="text-sm font-medium text-[var(--ep-fg)]">{field.label}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="flex min-h-11 items-center gap-2 rounded-[16px] border border-[var(--ep-border)] px-3 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() =>
                  onChange(
                    field.id,
                    selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]
                  )
                }
              />
              {opt}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
  if (field.type === "abc") {
    const abc = (value && typeof value === "object" ? value : {}) as Record<string, string>;
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["antecedent", "Antecedente"],
          ["behavior", "Comportamento"],
          ["consequence", "Consequência"],
        ].map(([id, label]) => (
          <label key={id} className="block text-sm">
            <span className="font-medium">{label}</span>
            <textarea
              className="mt-1 min-h-24 w-full rounded-[16px] border border-[var(--ep-border)] bg-[var(--ep-bg)] p-3"
              value={abc[id] ?? ""}
              onChange={(e) => onChange(field.id, { ...abc, [id]: e.target.value })}
            />
          </label>
        ))}
      </div>
    );
  }
  return (
    <label className="block text-sm">
      <span className="font-medium text-[var(--ep-fg)]">{field.label}</span>
      <input
        className="mt-1 w-full rounded-[16px] border border-[var(--ep-border)] bg-[var(--ep-bg)] px-3 py-2 text-[var(--ep-fg)]"
        value={String(value ?? "")}
        onChange={(e) => onChange(field.id, e.target.value)}
      />
    </label>
  );
}

export function SmartInputWizard({ runtime, input, onChange, onUpload, petContext, stepIndex, onStepIndex }: Props) {
  const steps = visibleWizardSteps(runtime, petContext).filter((s) => s.fields.length || s.upload);
  const safeIndex = Math.min(Math.max(0, stepIndex), Math.max(0, steps.length - 1));
  const step: WizardStep | undefined = steps[safeIndex];
  const pct = steps.length ? ((safeIndex + 1) / steps.length) * 100 : 100;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ecopet-green">
          Passo {safeIndex + 1} de {Math.max(steps.length, 1)}
        </p>
        <Progress className="mt-2" value={pct} label="Progresso do formulário" />
      </div>
      {step ? (
        <section className="rounded-[18px] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5">
          <h2 className="text-lg font-semibold text-[var(--ep-fg)]">{step.title}</h2>
          {step.description ? <p className="mt-1 text-sm text-[var(--ep-fg-muted)]">{step.description}</p> : null}
          <div className="mt-4 space-y-4">
            {step.fields.map((field) => (
              <FieldControl
                key={field.id}
                field={field}
                value={input[field.id]}
                input={input}
                onChange={(id, v) => onChange({ ...input, [id]: v })}
              />
            ))}
            {step.upload ? (
              <div>
                <p className="text-sm font-medium">{step.upload.label}</p>
                {step.upload.slots ? (
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {step.upload.slots.map((slot) => (
                      <label key={slot} className="rounded-[16px] border border-dashed border-[var(--ep-border)] p-3 text-center text-sm">
                        <span className="font-medium">{slot}</span>
                        <input
                          className="mt-2 w-full text-xs"
                          type="file"
                          accept={step.upload!.accept}
                          onChange={(e) => onUpload(e.target.files, step.upload!.kind)}
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    className="mt-2 block w-full text-sm"
                    type="file"
                    accept={step.upload.accept}
                    multiple={step.upload.multiple}
                    onChange={(e) => onUpload(e.target.files, step.upload!.kind)}
                  />
                )}
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <p className="text-sm text-[var(--ep-fg-muted)]">Nada pendente neste pet. Você já pode executar a análise.</p>
      )}
      {steps.length > 1 ? (
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-[var(--ep-border)] px-4 py-2 text-sm disabled:opacity-40"
            disabled={safeIndex === 0}
            onClick={() => onStepIndex(safeIndex - 1)}
          >
            Anterior
          </button>
          <button
            type="button"
            className="rounded-full border border-[var(--ep-border)] px-4 py-2 text-sm disabled:opacity-40"
            disabled={safeIndex >= steps.length - 1}
            onClick={() => onStepIndex(safeIndex + 1)}
          >
            Próximo
          </button>
        </div>
      ) : null}
    </div>
  );
}
