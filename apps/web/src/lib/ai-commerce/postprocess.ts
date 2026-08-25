import { detectRedFlags, isEmergencyRedFlag } from "./red-flags";
import { computeEnergyMath, computeWeightMath } from "./weight-math";
import { nextDueFromRule } from "./vaccination-rules";
import { computeNextBestAction } from "./next-best-action";
import { DIAGNOSTIC_STATUS } from "./provenance";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export function postprocessSpecialistOutput(params: {
  sku: string;
  capabilityId: string;
  input: Record<string, unknown> | null;
  output: unknown;
  weightHistory?: Array<{ weight: number; recordedAt: Date | string }>;
  species?: string | null;
}): Record<string, unknown> {
  const out = { ...asRecord(params.output) };
  const input = params.input ?? {};
  const flags = detectRedFlags(input);
  if (isEmergencyRedFlag(flags)) {
    out.urgency = {
      level: "EMERGENCY",
      reasons: Array.from(new Set([...asList(asRecord(out.urgency).reasons), ...flags.map((f) => f.reason)])),
    };
    out.urgencyLevel = "EMERGENCY";
    out.triageClass = "EMERGENCY";
    out.alerts = Array.from(new Set([...asList(out.alerts), ...flags.map((f) => f.reason)]));
  }

  const urgency = asRecord(out.urgency);
  if (!out.urgencyLevel && urgency.level) out.urgencyLevel = urgency.level;
  if (!out.recommendedNextSteps) out.recommendedNextSteps = asList(out.nextSteps);
  if (!out.vetQuestions) out.vetQuestions = asList(out.questionsForVeterinarian);
  if (!out.attentionSigns) out.attentionSigns = asList(out.alerts);
  if (!out.observations) {
    out.observations = asList(out.evidence).length
      ? asList(out.evidence)
      : asList(out.visibleObservations);
  }

  const impression = asRecord(out.diagnosticImpression);
  const quality = String(out.imageQuality ?? "");
  if (quality === "POOR" || quality === "UNUSABLE") {
    out.diagnosticImpression = {
      ...impression,
      confidence: "INSUFFICIENT_DATA",
      status: impression.status ?? DIAGNOSTIC_STATUS.AI_IMPRESSION,
    };
    out.newPhotoRecommended = true;
  }

  if (params.capabilityId.includes("peso") || params.sku === "AI_ECCOPESO") {
    const current = Number(input.weight);
    out.weightMath = computeWeightMath(
      (params.weightHistory ?? []).map((w) => ({ kg: w.weight, date: w.recordedAt })),
      Number.isFinite(current) ? current : null
    );
  }

  if (params.capabilityId.includes("nutri") || params.sku === "AI_ECCONUTRI") {
    const fromInput = Number(input.weight);
    const fromHistory = params.weightHistory?.at(-1)?.weight;
    const weightKg = Number.isFinite(fromInput) && fromInput > 0 ? fromInput : Number(fromHistory);
    if (Number.isFinite(weightKg) && weightKg > 0) {
      const kcalRaw = Number(String(input.kcalLabel ?? input.kcalPer100g ?? "").replace(",", "."));
      out.energyMath = computeEnergyMath({
        weightKg,
        goal: typeof input.goal === "string" ? input.goal : null,
        activity: typeof input.activity === "string" ? input.activity : null,
        kcalPer100g: Number.isFinite(kcalRaw) && kcalRaw > 0 ? kcalRaw : null,
      });
    }
  }

  if (params.capabilityId.includes("vacina") || params.sku === "AI_ECCOVACCINE") {
    const records = Array.isArray(out.extractedRecords) ? out.extractedRecords : [];
    out.extractedRecords = records.map((row) => {
      const rec = asRecord(row);
      const name = String(rec.name ?? input.name ?? "");
      const date = (rec.date as string | null) ?? (typeof input.date === "string" ? input.date : null);
      const rule = nextDueFromRule({ name, lastDate: date, species: params.species });
      return {
        ...rec,
        needsConfirmation: rec.needsConfirmation !== false,
        nextDueCalculated: rule.nextDue,
        nextDueSource: rule.source,
      };
    });
    if ((!records.length || records.length === 0) && input.name) {
      const rule = nextDueFromRule({
        name: String(input.name),
        lastDate: typeof input.date === "string" ? input.date : null,
        species: params.species,
      });
      out.ruleNextDue = rule;
    }
  }

  const nba = computeNextBestAction({ sku: params.sku, output: out, input });
  if (nba) out.nextBestAction = nba;

  if (typeof out.disclaimer !== "string" || !out.disclaimer.trim()) {
    out.disclaimer =
      "Resultados automatizados e orientativos. Não são laudo veterinário, atestado, receita ou parecer oficial.";
  }

  return out;
}

export function applySafetyLayer(output: Record<string, unknown>): Record<string, unknown> {
  const impression = asRecord(output.diagnosticImpression);
  if (impression.status === "VETERINARY_CONFIRMED_DIAGNOSIS") {
    output.diagnosticImpression = { ...impression, status: DIAGNOSTIC_STATUS.AI_IMPRESSION };
  }
  return output;
}
