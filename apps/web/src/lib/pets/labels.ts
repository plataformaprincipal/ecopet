import type { PetSize, PetSpecies } from "./types";

export const SPECIES_LABELS: Record<PetSpecies, string> = {
  DOG: "Cão",
  CAT: "Gato",
  BIRD: "Ave",
  RODENT: "Roedor",
  REPTILE: "Réptil",
  FISH: "Peixe",
  OTHER: "Outro",
};

export const SIZE_LABELS: Record<PetSize, string> = {
  MINI: "Mini",
  SMALL: "Pequeno",
  MEDIUM: "Médio",
  LARGE: "Grande",
  GIANT: "Gigante",
};

export const MEDICAL_TYPE_LABELS: Record<string, string> = {
  CONSULTATION: "Consulta",
  EXAM: "Exame",
  SURGERY: "Cirurgia",
  HOSPITALIZATION: "Internação",
  DIAGNOSIS: "Diagnóstico",
  PRESCRIPTION: "Receita",
  MEDICATION: "Medicamento",
  CERTIFICATE: "Atestado",
  REPORT: "Laudo",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  registration: "Cadastro",
  update: "Atualização",
  vaccine: "Vacina",
  consultation: "Consulta",
  exam: "Exame",
  medication: "Medicação",
  weight: "Peso",
  adoption: "Adoção",
  lost: "Perdido",
  found: "Encontrado",
};

export function computeAgeFromBirthDate(birthDate: string | null | undefined): string {
  if (!birthDate) return "—";
  const birth = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 12) return `${Math.max(months, 0)} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} ${years === 1 ? "ano" : "anos"}`;
  return `${years}a ${rem}m`;
}

export const DEFAULT_PET_PHOTO =
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80";

export const VACCINE_PRESETS = [
  "V10", "V8", "Antirrábica", "Giárdia", "Leishmaniose", "Gripe Canina",
  "Tríplice Felina", "Quádrupla Felina", "Leucemia Felina",
];
