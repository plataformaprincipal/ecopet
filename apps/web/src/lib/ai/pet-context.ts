/**
 * Contexto mínimo do pet para IA — fundação do Pet Knowledge Graph.
 * Retorna apenas dados necessários à capability ativa.
 */

export type PetAIContext = {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  ageLabel?: string | null;
  weightKg?: number | null;
  layers?: {
    identity: { name: string; species: string; breed?: string | null };
    health?: { recordedVaccines: number };
  };
};

export type PetAIContextInput = {
  pets: Array<{
    id: string;
    name: string;
    species: string;
    breed?: string | null;
    birthDate?: string | null;
    weight?: number | null;
    vaccineCount?: number;
  }>;
  activePetId: string | null;
};

function ageFromBirthDate(birthDate?: string | null): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const years = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (years < 1) return "< 1 ano";
  return `${years} ano${years === 1 ? "" : "s"}`;
}

/** Seleciona pet ativo e retorna contexto sanitizado para requests de IA. */
export function getPetAIContext(input: PetAIContextInput): PetAIContext | null {
  if (!input.pets.length) return null;
  const pet =
    (input.activePetId ? input.pets.find((p) => p.id === input.activePetId) : null) ??
    input.pets[0];
  if (!pet) return null;
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed ?? null,
    ageLabel: ageFromBirthDate(pet.birthDate),
    weightKg: typeof pet.weight === "number" ? pet.weight : null,
    layers: {
      identity: { name: pet.name, species: pet.species, breed: pet.breed ?? null },
      health:
        typeof pet.vaccineCount === "number"
          ? { recordedVaccines: pet.vaccineCount }
          : undefined,
    },
  };
}
