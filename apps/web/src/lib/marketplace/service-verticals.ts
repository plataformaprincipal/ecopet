/**
 * Verticais de Serviços — só slugs/enums já existentes no catálogo.
 * Sem segundo marketplace. Adoção e memória não inventam SKUs.
 */

import { serviceCategoryFromSlug } from "./categories";

export type ServiceVerticalKind = "catalog" | "cta" | "empty";

export type ServiceVertical = {
  id: string;
  labelKey: string;
  hintKey: string;
  kind: ServiceVerticalKind;
  slugs: string[];
  hrefs?: { href: string; labelKey: string }[];
};

export const SERVICE_VERTICALS: ServiceVertical[] = [
  {
    id: "health",
    labelKey: "marketplace.servicesPage.verticals.health",
    hintKey: "marketplace.servicesPage.verticals.healthHint",
    kind: "catalog",
    slugs: ["veterinario", "consulta", "vacinacao", "exames", "cirurgia", "24h", "consultoria"],
  },
  {
    id: "care",
    labelKey: "marketplace.servicesPage.verticals.care",
    hintKey: "marketplace.servicesPage.verticals.careHint",
    kind: "catalog",
    slugs: ["banho", "tosa", "banho-tosa", "hospedagem", "creche", "pet-sitter"],
  },
  {
    id: "routine",
    labelKey: "marketplace.servicesPage.verticals.routine",
    hintKey: "marketplace.servicesPage.verticals.routineHint",
    kind: "catalog",
    slugs: ["passeador", "adestramento", "creche", "pet-sitter"],
  },
  {
    id: "mobility",
    labelKey: "marketplace.servicesPage.verticals.mobility",
    hintKey: "marketplace.servicesPage.verticals.mobilityHint",
    kind: "catalog",
    slugs: ["transporte"],
  },
  {
    id: "adoption",
    labelKey: "marketplace.servicesPage.verticals.adoption",
    hintKey: "marketplace.servicesPage.verticals.adoptionHint",
    kind: "cta",
    slugs: [],
    hrefs: [
      { href: "/adocao", labelKey: "marketplace.servicesPage.adoptionLink" },
      { href: "/ngos", labelKey: "marketplace.servicesPage.ngosLink" },
    ],
  },
  {
    id: "memory",
    labelKey: "marketplace.servicesPage.verticals.memory",
    hintKey: "marketplace.servicesPage.verticals.memoryHint",
    kind: "empty",
    slugs: [],
  },
];

export const SERVICE_RAILS = [
  { id: "near", labelKey: "marketplace.servicesPage.rails.near" },
  { id: "openToday", labelKey: "marketplace.servicesPage.rails.openToday" },
  { id: "rating", labelKey: "marketplace.servicesPage.rails.rating" },
  { id: "value", labelKey: "marketplace.servicesPage.rails.value" },
  { id: "home", labelKey: "marketplace.servicesPage.rails.home" },
  { id: "verified", labelKey: "marketplace.servicesPage.rails.verified" },
] as const;

export type ServiceRailId = (typeof SERVICE_RAILS)[number]["id"];

export function getServiceVertical(id?: string | null): ServiceVertical | undefined {
  if (!id) return undefined;
  return SERVICE_VERTICALS.find((v) => v.id === id);
}

export function serviceEnumsForGroup(groupId?: string | null): string[] | undefined {
  const vertical = getServiceVertical(groupId);
  if (!vertical || vertical.kind !== "catalog" || vertical.slugs.length === 0) return undefined;
  const enums = vertical.slugs
    .map((slug) => serviceCategoryFromSlug(slug))
    .filter((id): id is NonNullable<typeof id> => Boolean(id));
  return enums.length ? enums : undefined;
}

export function suggestedServiceSlugsForSpecies(species?: string | null): string[] {
  switch (species) {
    case "DOG":
      return ["passeador", "adestramento", "banho", "veterinario", "vacinacao"];
    case "CAT":
      return ["veterinario", "vacinacao", "hospedagem", "pet-sitter", "exames"];
    case "BIRD":
    case "REPTILE":
      return ["exoticos", "veterinario", "consultoria"];
    case "FISH":
      return ["aquarismo", "consultoria"];
    case "RODENT":
      return ["veterinario", "exoticos", "exames"];
    default:
      return ["veterinario", "banho", "consultoria"];
  }
}
