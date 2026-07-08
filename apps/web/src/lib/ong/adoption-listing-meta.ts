/** Metadados estendidos do animal embutidos em `requirements` (sem migration). */

export type AdoptionListingMeta = {
  size?: string;
  sex?: string;
  healthCondition?: string;
  vaccinated?: boolean;
  neutered?: boolean;
  city?: string;
  state?: string;
  unavailable?: boolean;
  requirementsText?: string;
  weight?: number;
  lifecycleStatus?: string;
  rescueHistory?: string;
  behavior?: string;
  childFriendly?: boolean;
  animalFriendly?: boolean;
  medications?: string;
  documents?: string;
  internalNotes?: string;
  location?: string;
};

export const ANIMAL_LIFECYCLE_STATUSES = [
  "resgatado",
  "em_tratamento",
  "disponivel",
  "em_processo_adocao",
  "adotado",
  "lar_temporario",
  "falecido",
] as const;

export const LIFECYCLE_STATUS_LABELS: Record<string, string> = {
  resgatado: "Resgatado",
  em_tratamento: "Em tratamento",
  disponivel: "Disponível",
  em_processo_adocao: "Em processo de adoção",
  adotado: "Adotado",
  lar_temporario: "Lar temporário",
  falecido: "Falecido",
};

export const ADOPTION_FLOW_STAGES = [
  "formulario",
  "triagem",
  "entrevista",
  "visita",
  "aprovacao",
  "termo",
  "pos_adocao",
  "rejeicao",
] as const;

export const ADOPTION_STAGE_LABELS: Record<string, string> = {
  formulario: "Formulário",
  triagem: "Triagem",
  entrevista: "Entrevista",
  visita: "Visita",
  aprovacao: "Aprovação",
  termo: "Termo de adoção",
  pos_adocao: "Pós-adoção",
  rejeicao: "Rejeição",
};

export function adoptionStageFromStatus(status: string): string {
  switch (status) {
    case "PENDING":
      return "formulario";
    case "UNDER_REVIEW":
      return "triagem";
    case "APPROVED":
      return "aprovacao";
    case "COMPLETED":
      return "pos_adocao";
    case "REJECTED":
      return "rejeicao";
    case "CANCELLED":
      return "rejeicao";
    default:
      return "formulario";
  }
}

const META_PREFIX = "---ECOPET_META---";
const META_SUFFIX = "---END---";

export function packRequirements(meta: AdoptionListingMeta, text?: string | null): string {
  const payload = JSON.stringify({ ...meta, requirementsText: text ?? meta.requirementsText ?? "" });
  return `${META_PREFIX}${payload}${META_SUFFIX}`;
}

export function unpackRequirements(raw: string | null | undefined): {
  meta: AdoptionListingMeta;
  text: string;
} {
  if (!raw?.startsWith(META_PREFIX)) {
    return { meta: {}, text: raw ?? "" };
  }
  const end = raw.indexOf(META_SUFFIX, META_PREFIX.length);
  if (end === -1) return { meta: {}, text: raw };
  try {
    const json = raw.slice(META_PREFIX.length, end);
    const meta = JSON.parse(json) as AdoptionListingMeta;
    const text = meta.requirementsText ?? raw.slice(end + META_SUFFIX.length);
    return { meta, text };
  } catch {
    return { meta: {}, text: raw };
  }
}

export type OngAnimalDisplayStatus =
  | "disponivel"
  | "em_analise"
  | "adotado"
  | "indisponivel";

export function getOngAnimalDisplayStatus(
  status: string,
  meta: AdoptionListingMeta
): OngAnimalDisplayStatus {
  if (meta.unavailable) return "indisponivel";
  if (status === "ADOPTED") return "adotado";
  if (status === "PENDING") return "em_analise";
  return "disponivel";
}

export const ANIMAL_STATUS_LABELS: Record<OngAnimalDisplayStatus, string> = {
  disponivel: "Disponível",
  em_analise: "Em análise",
  adotado: "Adotado",
  indisponivel: "Indisponível",
};

export function displayStatusToAdoptionStatus(
  display: OngAnimalDisplayStatus
): { status: "AVAILABLE" | "PENDING" | "ADOPTED"; unavailable: boolean } {
  switch (display) {
    case "em_analise":
      return { status: "PENDING", unavailable: false };
    case "adotado":
      return { status: "ADOPTED", unavailable: false };
    case "indisponivel":
      return { status: "AVAILABLE", unavailable: true };
    default:
      return { status: "AVAILABLE", unavailable: false };
  }
}
