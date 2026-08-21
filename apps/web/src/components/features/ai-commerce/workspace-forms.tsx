"use client";

import { Button } from "@/components/ui/button";

type Props = {
  input: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  onUpload: (files: FileList | null, type: "vision" | "lab") => void;
};

function Field({
  id,
  label,
  value,
  onChange,
  textarea,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      {textarea ? (
        <textarea
          id={id}
          className="mt-1 min-h-24 w-full rounded-xl border bg-transparent p-3"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          className="mt-1 w-full rounded-xl border bg-transparent px-3 py-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`rounded-full border px-3 py-1 text-xs ${value === opt ? "border-ecopet-green bg-ecopet-green/10" : ""}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function EccovetForm({ input, onChange, onUpload }: Props) {
  return (
    <div className="space-y-4">
      <Field id="complaint" label="Queixa principal" textarea value={String(input.complaint ?? "")} onChange={(v) => onChange({ ...input, complaint: v })} />
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["onset", "Quando começou"],
          ["progress", "Progressão"],
          ["frequency", "Frequência"],
          ["intensity", "Intensidade percebida"],
          ["appetite", "Apetite"],
          ["water", "Água"],
          ["urine", "Urina"],
          ["stool", "Fezes"],
          ["vomit", "Vômitos"],
          ["activity", "Atividade"],
          ["sleep", "Sono"],
          ["breathing", "Respiração"],
          ["pain", "Dor aparente"],
          ["behavior", "Comportamento"],
          ["meds", "Medicamentos informados"],
          ["conditions", "Condições conhecidas"],
        ].map(([id, label]) => (
          <Field key={id} id={id} label={label} value={String(input[id] ?? "")} onChange={(v) => onChange({ ...input, [id]: v })} />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Anexos opcionais (foto ou PDF)</p>
      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={(e) => onUpload(e.target.files, "lab")} />
    </div>
  );
}

export function TriageForm({ input, onChange }: Props) {
  const flags = [
    ["breathing", "Respiração alterada"],
    ["consciousness", "Consciência alterada"],
    ["trauma", "Trauma"],
    ["seizure", "Convulsão"],
    ["bleeding", "Sangramento"],
    ["pain", "Dor intensa aparente"],
    ["toxin", "Ingestão de substância"],
    ["vomit", "Vômitos persistentes"],
    ["diarrhea", "Diarreia grave"],
    ["urine", "Incapacidade de urinar"],
    ["distension", "Distensão"],
  ] as const;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Responda só o essencial. Sinais graves não são minimizados.</p>
      <Field id="complaint" label="O que aconteceu agora?" textarea value={String(input.complaint ?? "")} onChange={(v) => onChange({ ...input, complaint: v })} />
      <div className="grid gap-2 sm:grid-cols-2">
        {flags.map(([id, label]) => (
          <label key={id} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(input[id])}
              onChange={(e) => onChange({ ...input, [id]: e.target.checked })}
            />
            {label}
          </label>
        ))}
      </div>
      <Field id="temperature" label="Temperatura informada (se houver)" value={String(input.temperature ?? "")} onChange={(v) => onChange({ ...input, temperature: v })} />
    </div>
  );
}

export function ReportForm({ input, onChange, onUpload }: Props) {
  const types = [
    "Resumo geral de saúde",
    "Resumo para consulta",
    "Histórico de acompanhamento",
    "Relatório de evolução",
    "Relatório de exames",
    "Relatório de medicamentos",
    "Relatório de vacinação",
  ];
  const sources = ["avaliações anteriores", "exames", "vacinas", "medicamentos", "peso", "notas", "arquivos"];
  const selected = Array.isArray(input.sources) ? (input.sources as string[]) : [];
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">Tipo de relatório</p>
      <Chips options={types} value={String(input.reportType ?? "")} onChange={(v) => onChange({ ...input, reportType: v })} />
      <p className="text-sm font-medium">Fontes</p>
      <div className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <button
            key={s}
            type="button"
            className={`rounded-full border px-3 py-1 text-xs ${selected.includes(s) ? "border-ecopet-green bg-ecopet-green/10" : ""}`}
            onClick={() =>
              onChange({
                ...input,
                sources: selected.includes(s) ? selected.filter((x) => x !== s) : [...selected, s],
              })
            }
          >
            {s}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(input.technicalDraft)}
          onChange={(e) => onChange({ ...input, technicalDraft: e.target.checked })}
        />
        Gerar minuta técnica (sem assinatura veterinária)
      </label>
      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={(e) => onUpload(e.target.files, "lab")} />
    </div>
  );
}

export function ExamsForm({ input, onChange, onUpload }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm">Envie o exame em PDF, JPEG, PNG ou WEBP. Prefira o original nítido.</p>
      <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple onChange={(e) => onUpload(e.target.files, "lab")} />
      <Field id="notes" label="Observações (opcional)" textarea value={String(input.notes ?? "")} onChange={(v) => onChange({ ...input, notes: v })} />
      {Array.isArray(input.extractedMarkers) && (
        <div className="rounded-xl border p-3 text-sm">
          <p className="font-medium">Confirme os dados extraídos</p>
          <p className="text-muted-foreground">Ajuste valores incertos antes da interpretação.</p>
        </div>
      )}
    </div>
  );
}

export function VisionForm({ input, onChange, onUpload }: Props) {
  const regions = ["pele", "pelagem", "olhos", "ouvidos", "boca", "dentes", "patas", "unhas", "feridas", "lesões aparentes", "condição corporal", "fezes", "outro"];
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">Região</p>
      <Chips options={regions} value={String(input.region ?? "")} onChange={(v) => onChange({ ...input, region: v })} />
      <ul className="list-disc pl-5 text-sm text-muted-foreground">
        <li>boa iluminação, sem filtro</li>
        <li>foco adequado</li>
        <li>ângulo geral e detalhe</li>
      </ul>
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => onUpload(e.target.files, "vision")} />
    </div>
  );
}

export function DentalForm({ input, onChange, onUpload }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm">Guia de captura. Não force a boca do animal.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {["frontal", "lateral esquerda", "lateral direita"].map((slot) => (
          <div key={slot} className="rounded-xl border p-3 text-center text-sm">
            <p className="font-medium">{slot}</p>
            <input className="mt-2 w-full text-xs" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onUpload(e.target.files, "vision")} />
          </div>
        ))}
      </div>
      <Field id="notes" label="O que você observou?" textarea value={String(input.notes ?? "")} onChange={(v) => onChange({ ...input, notes: v })} />
    </div>
  );
}

export function NutriForm({ input, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["diet", "Alimentação atual"],
          ["amount", "Quantidade"],
          ["frequency", "Frequência"],
          ["treats", "Petiscos"],
          ["water", "Água"],
          ["activity", "Atividade"],
          ["goal", "Objetivo"],
          ["restrictions", "Restrições informadas"],
        ].map(([id, label]) => (
          <Field key={id} id={id} label={label} value={String(input[id] ?? "")} onChange={(v) => onChange({ ...input, [id]: v })} />
        ))}
      </div>
    </div>
  );
}

export function PesoForm({ input, onChange, onUpload }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="weight" label="Peso atual" value={String(input.weight ?? "")} onChange={(v) => onChange({ ...input, weight: v })} />
        <Field id="unit" label="Unidade" value={String(input.unit ?? "kg")} onChange={(v) => onChange({ ...input, unit: v })} />
        <Field id="goal" label="Meta" value={String(input.goal ?? "")} onChange={(v) => onChange({ ...input, goal: v })} />
        <Field id="activity" label="Atividade" value={String(input.activity ?? "")} onChange={(v) => onChange({ ...input, activity: v })} />
      </div>
      <p className="text-sm text-muted-foreground">Foto lateral/superior opcional — não afirma precisão clínica.</p>
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => onUpload(e.target.files, "vision")} />
    </div>
  );
}

export function BehaviorForm({ input, onChange }: Props) {
  const cats = ["ansiedade", "separação", "medo", "agressividade relatada", "latidos", "destruição", "eliminação inadequada", "socialização", "filhote", "adaptação", "mudança de ambiente", "outro"];
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">Categoria</p>
      <Chips options={cats} value={String(input.category ?? "")} onChange={(v) => onChange({ ...input, category: v })} />
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["when", "Quando acontece"],
          ["trigger", "Gatilho"],
          ["frequency", "Frequência"],
          ["duration", "Duração"],
          ["intensity", "Intensidade"],
          ["people", "Pessoas presentes"],
          ["animals", "Animais presentes"],
          ["environment", "Ambiente"],
          ["routine", "Rotina"],
        ].map(([id, label]) => (
          <Field key={id} id={id} label={label} value={String(input[id] ?? "")} onChange={(v) => onChange({ ...input, [id]: v })} />
        ))}
      </div>
    </div>
  );
}

export function VaccineForm({ input, onChange, onUpload }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm">Carteira digital. Nunca inventamos dose aplicada.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["name", "Vacina"],
          ["manufacturer", "Fabricante (opcional)"],
          ["batch", "Lote (opcional)"],
          ["date", "Data"],
          ["dose", "Dose"],
          ["place", "Estabelecimento"],
          ["nextDue", "Próxima dose"],
        ].map(([id, label]) => (
          <Field key={id} id={id} label={label} value={String(input[id] ?? "")} onChange={(v) => onChange({ ...input, [id]: v })} />
        ))}
      </div>
      <p className="text-sm">Foto do comprovante (OCR — você confirma antes de salvar)</p>
      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => onUpload(e.target.files, "lab")} />
    </div>
  );
}

export function MedForm({ input, onChange, onUpload }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm">Organiza o que já foi prescrito. A IA não altera dose.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["name", "Medicamento informado"],
          ["presentation", "Apresentação"],
          ["dose", "Dose prescrita informada"],
          ["frequency", "Frequência"],
          ["time", "Horário"],
          ["start", "Início"],
          ["end", "Fim"],
          ["prescriber", "Prescritor informado"],
        ].map(([id, label]) => (
          <Field key={id} id={id} label={label} value={String(input[id] ?? "")} onChange={(v) => onChange({ ...input, [id]: v })} />
        ))}
      </div>
      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => onUpload(e.target.files, "lab")} />
    </div>
  );
}

export function CheckupForm({ input, onChange }: Props) {
  const sections = [
    ["feeding", "Alimentação"],
    ["weight", "Peso"],
    ["water", "Água"],
    ["urine", "Urina"],
    ["stool", "Fezes"],
    ["activity", "Atividade"],
    ["sleep", "Sono"],
    ["breathing", "Respiração"],
    ["skin", "Pele e pelagem"],
    ["eyes", "Olhos e ouvidos"],
    ["teeth", "Dentes"],
    ["behavior", "Comportamento"],
    ["pain", "Dor aparente"],
    ["mobility", "Mobilidade"],
    ["vaccines", "Vacinas"],
    ["meds", "Medicamentos"],
    ["prevention", "Prevenção"],
  ];
  const current = Number(input.section ?? 0);
  const [id, label] = sections[Math.min(current, sections.length - 1)]!;
  return (
    <div className="mx-auto max-w-md space-y-4">
      <p className="text-xs text-muted-foreground">
        {current + 1} / {sections.length}
      </p>
      <Field id={id} label={label} textarea value={String(input[id] ?? "")} onChange={(v) => onChange({ ...input, [id]: v })} />
      <div className="flex gap-2">
        <Button type="button" variant="outline" disabled={current === 0} onClick={() => onChange({ ...input, section: current - 1 })}>
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={current >= sections.length - 1}
          onClick={() => onChange({ ...input, section: current + 1 })}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}

export function ProfileForm({ input, onChange, onUpload }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm">Organize o dossiê com o que já existe no pet. Novas compras alimentam a timeline.</p>
      <Field id="notes" label="O que deve entrar neste resumo?" textarea value={String(input.notes ?? "")} onChange={(v) => onChange({ ...input, notes: v })} />
      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={(e) => onUpload(e.target.files, "lab")} />
    </div>
  );
}

export function SpecializedForm({
  kind,
  ...props
}: Props & { kind: string }) {
  if (kind === "triage") return <TriageForm {...props} />;
  if (kind === "report") return <ReportForm {...props} />;
  if (kind === "exams") return <ExamsForm {...props} />;
  if (kind === "vision") return <VisionForm {...props} />;
  if (kind === "dental") return <DentalForm {...props} />;
  if (kind === "nutri") return <NutriForm {...props} />;
  if (kind === "peso") return <PesoForm {...props} />;
  if (kind === "behavior") return <BehaviorForm {...props} />;
  if (kind === "vaccine") return <VaccineForm {...props} />;
  if (kind === "med") return <MedForm {...props} />;
  if (kind === "checkup") return <CheckupForm {...props} />;
  if (kind === "profile") return <ProfileForm {...props} />;
  return <EccovetForm {...props} />;
}
