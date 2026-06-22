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
};

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
