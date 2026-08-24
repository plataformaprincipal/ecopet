export const RED_FLAG_KEYS = [
  "breathing",
  "consciousness",
  "seizure",
  "bleeding",
  "trauma",
  "toxin",
  "collapse",
  "urine_obstruction",
  "rapid_deterioration",
] as const;

export type RedFlagKey = (typeof RED_FLAG_KEYS)[number];

const PATTERNS: Array<{ key: RedFlagKey; re: RegExp; reason: string }> = [
  { key: "breathing", re: /respirat[oó]ri|falta de ar|engasg|cianose|n[aã]o (est[aá] )?respir|dificuldade (para )?respir/i, reason: "dificuldade respiratória relatada" },
  { key: "consciousness", re: /inconsciente|desmai|n[aã]o responde|coma|n[aã]o acorda/i, reason: "alteração de consciência relatada" },
  { key: "seizure", re: /convuls|ataque epil|espasmo prolong/i, reason: "convulsão relatada" },
  { key: "bleeding", re: /sangramento (intenso|muito|abundant)|hemorragia|sangra muito/i, reason: "sangramento intenso relatado" },
  { key: "trauma", re: /atropel|queda (de|do)|trauma grave|fratura exposta|mordida grave/i, reason: "trauma grave relatado" },
  { key: "toxin", re: /intoxica|veneno|ingestão suspeita|comeu chocolate|comeu uva|veneno de rato|inseticida/i, reason: "suspeita de intoxicação" },
  { key: "collapse", re: /n[aã]o (consegue|conseguiu) (ficar em p[eé]|levantar|andar)|paralis|colapso/i, reason: "incapacidade aguda de ficar em pé" },
  { key: "urine_obstruction", re: /n[aã]o (consegue|conseguiu) urinar|obstru[cç][aã]o urin|distens[aã]o (abdominal|da bexiga)/i, reason: "incapacidade de urinar ou distensão relatada" },
  { key: "rapid_deterioration", re: /piora (r[aá]pida|s[uú]bita)|deteriora[cç][aã]o r[aá]pida/i, reason: "deterioração rápida relatada" },
];

export type RedFlagHit = { key: RedFlagKey; reason: string };

function collectText(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "string") return input;
  if (typeof input === "boolean") return input ? "true" : "";
  if (typeof input === "number") return String(input);
  if (Array.isArray(input)) return input.map(collectText).join(" ");
  if (typeof input === "object") {
    return Object.entries(input as Record<string, unknown>)
      .map(([k, v]) => `${k} ${collectText(v)}`)
      .join(" ");
  }
  return "";
}

export function detectRedFlags(input: Record<string, unknown> | null | undefined): RedFlagHit[] {
  if (!input) return [];
  const hits: RedFlagHit[] = [];
  const seen = new Set<RedFlagKey>();

  const booleanFlags: Array<[string, RedFlagKey, string]> = [
    ["breathing", "breathing", "dificuldade respiratória relatada"],
    ["consciousness", "consciousness", "alteração de consciência relatada"],
    ["seizure", "seizure", "convulsão relatada"],
    ["bleeding", "bleeding", "sangramento intenso relatado"],
    ["trauma", "trauma", "trauma grave relatado"],
    ["toxin", "toxin", "suspeita de intoxicação"],
    ["collapse", "collapse", "incapacidade aguda de ficar em pé"],
  ];
  for (const [field, key, reason] of booleanFlags) {
    if (input[field] === true && !seen.has(key)) {
      seen.add(key);
      hits.push({ key, reason });
    }
  }

  const blob = collectText(input);
  for (const rule of PATTERNS) {
    if (seen.has(rule.key)) continue;
    if (rule.re.test(blob)) {
      seen.add(rule.key);
      hits.push({ key: rule.key, reason: rule.reason });
    }
  }
  return hits;
}

export function isEmergencyRedFlag(hits: RedFlagHit[]): boolean {
  return hits.length > 0;
}
