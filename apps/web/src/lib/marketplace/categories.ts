import type { ProductCatalogCategory, ReadyServiceCategory } from "@prisma/client";

export type CategoryOption = {
  id: string;
  slug: string;
  labelKey: string;
  subcategories?: { slug: string; labelKey: string }[];
};

export const PRODUCT_CATEGORIES: CategoryOption[] = [
  { id: "FOOD", slug: "alimentacao", labelKey: "marketplace.catalog.products.food" },
  { id: "MEDICINE", slug: "medicamentos", labelKey: "marketplace.catalog.products.medicine" },
  { id: "HYGIENE", slug: "higiene", labelKey: "marketplace.catalog.products.hygiene" },
  { id: "ACCESSORIES", slug: "acessorios", labelKey: "marketplace.catalog.products.accessories" },
  { id: "TOYS", slug: "brinquedos", labelKey: "marketplace.catalog.products.toys" },
  { id: "COLLARS", slug: "coleiras", labelKey: "marketplace.catalog.products.collars" },
  { id: "HARNESSES", slug: "peitorais", labelKey: "marketplace.catalog.products.harnesses" },
  { id: "LEASHES", slug: "guias", labelKey: "marketplace.catalog.products.leashes" },
  { id: "BEDDING", slug: "camas", labelKey: "marketplace.catalog.products.bedding" },
  { id: "HOUSING", slug: "casinhas", labelKey: "marketplace.catalog.products.housing" },
  { id: "TRANSPORT", slug: "transporte", labelKey: "marketplace.catalog.products.transport" },
  { id: "AQUARIUM", slug: "aquarismo", labelKey: "marketplace.catalog.products.aquarium" },
  { id: "EQUINE", slug: "equinos", labelKey: "marketplace.catalog.products.equine" },
  { id: "CATTLE", slug: "bovinos", labelKey: "marketplace.catalog.products.cattle" },
  { id: "BIRDS", slug: "aves", labelKey: "marketplace.catalog.products.birds" },
  { id: "EXOTIC", slug: "exoticos", labelKey: "marketplace.catalog.products.exotic" },
  { id: "TECHNOLOGY", slug: "tecnologia", labelKey: "marketplace.catalog.products.technology" },
  { id: "TRAINING", slug: "treinamento", labelKey: "marketplace.catalog.products.training" },
  { id: "HEALTH", slug: "saude", labelKey: "marketplace.catalog.products.health" },
  { id: "OTHER", slug: "outros", labelKey: "marketplace.catalog.products.other" },
];

export const SERVICE_CATEGORIES: CategoryOption[] = [
  { id: "VETERINARY", slug: "veterinario", labelKey: "marketplace.catalog.services.veterinary" },
  { id: "VET_CONSULTATION", slug: "consulta", labelKey: "marketplace.catalog.services.consultation" },
  { id: "BATH", slug: "banho", labelKey: "marketplace.catalog.services.bath" },
  { id: "GROOMING", slug: "tosa", labelKey: "marketplace.catalog.services.grooming" },
  { id: "BATH_GROOMING", slug: "banho-tosa", labelKey: "marketplace.catalog.services.bathGrooming" },
  { id: "BOARDING", slug: "hospedagem", labelKey: "marketplace.catalog.services.boarding" },
  { id: "DAYCARE", slug: "creche", labelKey: "marketplace.catalog.services.daycare" },
  { id: "TRAINING", slug: "adestramento", labelKey: "marketplace.catalog.services.training" },
  { id: "DOG_WALKER", slug: "passeador", labelKey: "marketplace.catalog.services.dogWalker" },
  { id: "PET_TRANSPORT", slug: "transporte", labelKey: "marketplace.catalog.services.transport" },
  { id: "PET_SITTER", slug: "pet-sitter", labelKey: "marketplace.catalog.services.petSitter" },
  { id: "EXAMS", slug: "exames", labelKey: "marketplace.catalog.services.exams" },
  { id: "VACCINATION", slug: "vacinacao", labelKey: "marketplace.catalog.services.vaccination" },
  { id: "SURGERY", slug: "cirurgia", labelKey: "marketplace.catalog.services.surgery" },
  { id: "CONSULTING", slug: "consultoria", labelKey: "marketplace.catalog.services.consulting" },
  { id: "REPRODUCTION", slug: "reproducao", labelKey: "marketplace.catalog.services.reproduction" },
  { id: "AQUARIUM", slug: "aquarismo", labelKey: "marketplace.catalog.services.aquarium" },
  { id: "EQUINE", slug: "equinos", labelKey: "marketplace.catalog.services.equine" },
  { id: "CATTLE", slug: "bovinos", labelKey: "marketplace.catalog.services.cattle" },
  { id: "EXOTIC", slug: "exoticos", labelKey: "marketplace.catalog.services.exotic" },
  { id: "EMERGENCY_24H", slug: "24h", labelKey: "marketplace.catalog.services.emergency24h" },
  { id: "OTHER", slug: "outros", labelKey: "marketplace.catalog.services.other" },
];

export function productCategoryFromSlug(slug: string): ProductCatalogCategory | undefined {
  const found = PRODUCT_CATEGORIES.find((c) => c.slug === slug || c.id === slug);
  return found?.id as ProductCatalogCategory | undefined;
}

const SERVICE_SLUG_ALIASES: Record<string, string> = {
  "consulta-vet": "consulta",
  consulta_vet: "consulta",
  "vet-consultation": "consulta",
  walker: "passeador",
  "dog-walker": "passeador",
};

export function serviceCategoryFromSlug(slug: string): ReadyServiceCategory | undefined {
  const normalized = SERVICE_SLUG_ALIASES[slug] ?? slug;
  const found = SERVICE_CATEGORIES.find((c) => c.slug === normalized || c.id === normalized || c.id === slug);
  return found?.id as ReadyServiceCategory | undefined;
}

export function productCategoryLabelKey(category: string): string {
  const found = PRODUCT_CATEGORIES.find((c) => c.id === category || c.slug === category);
  return found?.labelKey ?? "marketplace.catalog.products.other";
}

export function serviceCategoryLabelKey(category: string): string {
  const found = SERVICE_CATEGORIES.find((c) => c.id === category || c.slug === category);
  return found?.labelKey ?? "marketplace.catalog.services.other";
}

export const PRODUCT_CATEGORY_GROUPS: { id: string; labelKey: string; slugs: string[] }[] = [
  { id: "food", labelKey: "marketplace.groups.food", slugs: ["alimentacao"] },
  { id: "hygiene", labelKey: "marketplace.groups.hygiene", slugs: ["higiene"] },
  { id: "health", labelKey: "marketplace.groups.health", slugs: ["saude", "medicamentos"] },
  { id: "home", labelKey: "marketplace.groups.home", slugs: ["camas", "casinhas", "acessorios", "brinquedos"] },
  { id: "mobility", labelKey: "marketplace.groups.mobility", slugs: ["transporte", "coleiras", "peitorais", "guias"] },
  { id: "training", labelKey: "marketplace.groups.training", slugs: ["treinamento"] },
  { id: "otherAnimals", labelKey: "marketplace.groups.otherAnimals", slugs: ["aquarismo", "equinos", "bovinos", "aves", "exoticos"] },
  { id: "other", labelKey: "marketplace.groups.other", slugs: ["tecnologia", "outros"] },
];

export const SERVICE_CATEGORY_GROUPS: { id: string; labelKey: string; slugs: string[] }[] = [
  { id: "health", labelKey: "marketplace.groups.health", slugs: ["veterinario", "consulta", "vacinacao", "exames", "cirurgia", "24h"] },
  { id: "care", labelKey: "marketplace.groups.care", slugs: ["banho", "tosa", "banho-tosa", "hospedagem", "creche", "pet-sitter"] },
  { id: "routine", labelKey: "marketplace.groups.routine", slugs: ["adestramento", "passeador"] },
  { id: "mobility", labelKey: "marketplace.groups.mobility", slugs: ["transporte"] },
  { id: "other", labelKey: "marketplace.groups.other", slugs: ["consultoria", "reproducao", "aquarismo", "equinos", "bovinos", "exoticos", "outros"] },
];
