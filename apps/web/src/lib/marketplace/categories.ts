import type { ProductCatalogCategory, ReadyServiceCategory } from "@prisma/client";

export type CategoryOption = {
  id: string;
  slug: string;
  labelKey: string;
  subcategories?: { slug: string; labelKey: string }[];
};

export const PRODUCT_CATEGORIES: CategoryOption[] = [
  { id: "FOOD", slug: "alimentacao", labelKey: "marketplace.categories.products.food" },
  { id: "MEDICINE", slug: "medicamentos", labelKey: "marketplace.categories.products.medicine" },
  { id: "HYGIENE", slug: "higiene", labelKey: "marketplace.categories.products.hygiene" },
  { id: "ACCESSORIES", slug: "acessorios", labelKey: "marketplace.categories.products.accessories" },
  { id: "TOYS", slug: "brinquedos", labelKey: "marketplace.categories.products.toys" },
  { id: "COLLARS", slug: "coleiras", labelKey: "marketplace.categories.products.collars" },
  { id: "HARNESSES", slug: "peitorais", labelKey: "marketplace.categories.products.harnesses" },
  { id: "LEASHES", slug: "guias", labelKey: "marketplace.categories.products.leashes" },
  { id: "BEDDING", slug: "camas", labelKey: "marketplace.categories.products.bedding" },
  { id: "HOUSING", slug: "casinhas", labelKey: "marketplace.categories.products.housing" },
  { id: "TRANSPORT", slug: "transporte", labelKey: "marketplace.categories.products.transport" },
  { id: "AQUARIUM", slug: "aquarismo", labelKey: "marketplace.categories.products.aquarium" },
  { id: "EQUINE", slug: "equinos", labelKey: "marketplace.categories.products.equine" },
  { id: "CATTLE", slug: "bovinos", labelKey: "marketplace.categories.products.cattle" },
  { id: "BIRDS", slug: "aves", labelKey: "marketplace.categories.products.birds" },
  { id: "EXOTIC", slug: "exoticos", labelKey: "marketplace.categories.products.exotic" },
  { id: "TECHNOLOGY", slug: "tecnologia", labelKey: "marketplace.categories.products.technology" },
  { id: "TRAINING", slug: "treinamento", labelKey: "marketplace.categories.products.training" },
  { id: "HEALTH", slug: "saude", labelKey: "marketplace.categories.products.health" },
  { id: "OTHER", slug: "outros", labelKey: "marketplace.categories.products.other" },
];

export const SERVICE_CATEGORIES: CategoryOption[] = [
  { id: "VETERINARY", slug: "veterinario", labelKey: "marketplace.categories.services.veterinary" },
  { id: "BATH", slug: "banho", labelKey: "marketplace.categories.services.bath" },
  { id: "GROOMING", slug: "tosa", labelKey: "marketplace.categories.services.grooming" },
  { id: "BATH_GROOMING", slug: "banho-tosa", labelKey: "marketplace.categories.services.bathGrooming" },
  { id: "BOARDING", slug: "hospedagem", labelKey: "marketplace.categories.services.boarding" },
  { id: "DAYCARE", slug: "creche", labelKey: "marketplace.categories.services.daycare" },
  { id: "TRAINING", slug: "adestramento", labelKey: "marketplace.categories.services.training" },
  { id: "DOG_WALKER", slug: "passeador", labelKey: "marketplace.categories.services.dogWalker" },
  { id: "PET_TRANSPORT", slug: "transporte", labelKey: "marketplace.categories.services.transport" },
  { id: "PET_SITTER", slug: "pet-sitter", labelKey: "marketplace.categories.services.petSitter" },
  { id: "EXAMS", slug: "exames", labelKey: "marketplace.categories.services.exams" },
  { id: "VACCINATION", slug: "vacinacao", labelKey: "marketplace.categories.services.vaccination" },
  { id: "SURGERY", slug: "cirurgia", labelKey: "marketplace.categories.services.surgery" },
  { id: "CONSULTING", slug: "consultoria", labelKey: "marketplace.categories.services.consulting" },
  { id: "REPRODUCTION", slug: "reproducao", labelKey: "marketplace.categories.services.reproduction" },
  { id: "AQUARIUM", slug: "aquarismo", labelKey: "marketplace.categories.services.aquarium" },
  { id: "EQUINE", slug: "equinos", labelKey: "marketplace.categories.services.equine" },
  { id: "CATTLE", slug: "bovinos", labelKey: "marketplace.categories.services.cattle" },
  { id: "EXOTIC", slug: "exoticos", labelKey: "marketplace.categories.services.exotic" },
  { id: "EMERGENCY_24H", slug: "24h", labelKey: "marketplace.categories.services.emergency24h" },
  { id: "OTHER", slug: "outros", labelKey: "marketplace.categories.services.other" },
];

export function productCategoryFromSlug(slug: string): ProductCatalogCategory | undefined {
  const found = PRODUCT_CATEGORIES.find((c) => c.slug === slug || c.id === slug);
  return found?.id as ProductCatalogCategory | undefined;
}

export function serviceCategoryFromSlug(slug: string): ReadyServiceCategory | undefined {
  const found = SERVICE_CATEGORIES.find((c) => c.slug === slug || c.id === slug);
  return found?.id as ReadyServiceCategory | undefined;
}

export function productCategoryLabelKey(category: string): string {
  const found = PRODUCT_CATEGORIES.find((c) => c.id === category || c.slug === category);
  return found?.labelKey ?? "marketplace.categories.products.other";
}

export function serviceCategoryLabelKey(category: string): string {
  const found = SERVICE_CATEGORIES.find((c) => c.id === category || c.slug === category);
  return found?.labelKey ?? "marketplace.categories.services.other";
}
