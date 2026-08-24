export type VaccineRule = {
  name: string;
  species: Array<"DOG" | "CAT" | "OTHER">;
  intervalDays: number | null;
  notes: string;
};

export const VACCINATION_RULES_VERSION = "eccovacina-rules-v1";

export const VACCINATION_RULES: VaccineRule[] = [
  { name: "V10 / V8", species: ["DOG"], intervalDays: 365, notes: "Reforço anual típico após protocolo inicial. Confirme com o veterinário." },
  { name: "Antirrábica", species: ["DOG", "CAT"], intervalDays: 365, notes: "Intervalo legal e clínico varia por jurisdição e produto." },
  { name: "Giárdia", species: ["DOG"], intervalDays: 365, notes: "Conforme critério veterinário e risco epidemiológico." },
  { name: "Gripe canina", species: ["DOG"], intervalDays: 365, notes: "Conforme exposição e critério veterinário." },
  { name: "V3 / V4 / V5 felina", species: ["CAT"], intervalDays: 365, notes: "Reforço periódico após protocolo inicial." },
  { name: "Leucemia felina", species: ["CAT"], intervalDays: 365, notes: "Conforme risco de exposição." },
];

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function matchVaccineRule(name: string, species?: string | null): VaccineRule | null {
  const n = normalizeName(name);
  if (!n) return null;
  const sp = species?.toUpperCase() === "CAT" || species?.toUpperCase() === "GATO" ? "CAT" : species?.toUpperCase() === "DOG" || species?.toUpperCase() === "CÃO" || species?.toUpperCase() === "CAO" ? "DOG" : "OTHER";
  return (
    VACCINATION_RULES.find((rule) => {
      if (sp !== "OTHER" && !rule.species.includes(sp)) return false;
      const rn = normalizeName(rule.name);
      return n.includes(rn) || rn.includes(n) || n.includes("raiva") && rn.includes("antirrabica") || n.includes("v10") && rn.includes("v10") || n.includes("v8") && rn.includes("v8");
    }) ?? null
  );
}

export function nextDueFromRule(params: {
  name: string;
  lastDate: string | Date | null;
  species?: string | null;
}): { nextDue: string | null; source: "SYSTEM_CALCULATED"; ruleVersion: string; notes: string } | { nextDue: null; source: "INSUFFICIENT_DATA"; ruleVersion: string; notes: string } {
  const rule = matchVaccineRule(params.name, params.species);
  if (!rule || !rule.intervalDays || !params.lastDate) {
    return {
      nextDue: null,
      source: "INSUFFICIENT_DATA",
      ruleVersion: VACCINATION_RULES_VERSION,
      notes: "Próxima dose não calculada: faltam data aplicada ou regra compatível. Não inventamos calendário.",
    };
  }
  const last = params.lastDate instanceof Date ? params.lastDate : new Date(params.lastDate);
  if (Number.isNaN(last.getTime())) {
    return {
      nextDue: null,
      source: "INSUFFICIENT_DATA",
      ruleVersion: VACCINATION_RULES_VERSION,
      notes: "Data inválida. Confirme o comprovante antes de calcular a próxima dose.",
    };
  }
  const next = new Date(last.getTime() + rule.intervalDays * 24 * 60 * 60 * 1000);
  return {
    nextDue: next.toISOString().slice(0, 10),
    source: "SYSTEM_CALCULATED",
    ruleVersion: VACCINATION_RULES_VERSION,
    notes: rule.notes,
  };
}
