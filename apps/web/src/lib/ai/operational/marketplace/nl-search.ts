/**
 * Marketplace IA — linguagem natural → filtros reais (sem inventar preços/estoque).
 */
import type { PublicProductFilters, PublicServiceFilters } from "@/lib/marketplace/public-query";

export type MarketplaceNlIntent = "products" | "services" | "unknown";

export type MarketplaceNlPlan = {
  intent: MarketplaceNlIntent;
  productFilters: PublicProductFilters;
  serviceFilters: PublicServiceFilters;
  interpretation: string[];
  suggestedQuery: string;
};

const SPECIES: Array<{ re: RegExp; value: string }> = [
  { re: /\b(cachorro|cão|cao|dog|canino)/i, value: "DOG" },
  { re: /\b(gato|felino|cat)/i, value: "CAT" },
  { re: /\b(pássaro|passaro|ave|bird)/i, value: "BIRD" },
];

const PRODUCT_CATS: Array<{ re: RegExp; value: string }> = [
  { re: /\b(ração|racao|alimento|alimentação|alimentacao|food)/i, value: "FOOD" },
  { re: /\b(brinquedo|toy)/i, value: "TOYS" },
  { re: /\b(higiene|shampoo)/i, value: "HYGIENE" },
  { re: /\b(coleira)/i, value: "COLLARS" },
  { re: /\b(medicamento|remédio|remedio)/i, value: "MEDICINE" },
  { re: /\b(acessório|acessorio)/i, value: "ACCESSORIES" },
];

const SERVICE_CATS: Array<{ re: RegExp; value: string }> = [
  { re: /\b(banho\s*e\s*tosa|banho|tosa|grooming)/i, value: "BATH_GROOMING" },
  { re: /\b(veterin|consulta)/i, value: "VETERINARY" },
  { re: /\b(hospedagem|hotel)/i, value: "BOARDING" },
  { re: /\b(creche|daycare)/i, value: "DAYCARE" },
  { re: /\b(adestramento|treino|training)/i, value: "TRAINING" },
  { re: /\b(passeador|dog\s*walker)/i, value: "DOG_WALKER" },
];

function extractPriceMax(text: string): number | undefined {
  const m =
    text.match(/(?:até|ate|até\s*R\$|max(?:imo)?|under|até)\s*R?\$?\s*(\d+(?:[.,]\d+)?)/i) ||
    text.match(/R\$\s*(\d+(?:[.,]\d+)?)/i);
  if (!m) return undefined;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function extractPriceMin(text: string): number | undefined {
  const m = text.match(/(?:a\s*partir|desde|min(?:imo)?|from)\s*(?:de\s*)?R?\$?\s*(\d+(?:[.,]\d+)?)/i);
  if (!m) return undefined;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function stripFilterTerms(text: string): string {
  return text
    .replace(/até\s*R?\$?\s*\d+(?:[.,]\d+)?/gi, " ")
    .replace(/R\$\s*\d+(?:[.,]\d+)?/gi, " ")
    .replace(/\b(quero|mostre|mostrar|preciso|encontrar|produto|produtos|serviço|servico|serviços|servicos)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseMarketplaceNaturalLanguage(message: string): MarketplaceNlPlan {
  const text = message.trim().slice(0, 500);
  const notes: string[] = [];

  const looksService =
    SERVICE_CATS.some((c) => c.re.test(text)) ||
    /\b(serviço|servico|agendar|hoje|amanhã|amanha)\b/i.test(text);
  const looksProduct =
    PRODUCT_CATS.some((c) => c.re.test(text)) ||
    /\b(produto|ração|racao|comprar|preço|preco)\b/i.test(text);

  let intent: MarketplaceNlIntent = "unknown";
  if (looksService && !looksProduct) intent = "services";
  else if (looksProduct && !looksService) intent = "products";
  else if (looksService) intent = "services";
  else if (looksProduct) intent = "products";
  else intent = "products";

  notes.push(`Intenção: ${intent}`);

  const species = SPECIES.find((s) => s.re.test(text))?.value;
  if (species) notes.push(`Espécie: ${species}`);

  const maxPrice = extractPriceMax(text);
  const minPrice = extractPriceMin(text);
  if (maxPrice != null) notes.push(`Preço máximo: ${maxPrice}`);
  if (minPrice != null) notes.push(`Preço mínimo: ${minPrice}`);

  const productCat = PRODUCT_CATS.find((c) => c.re.test(text))?.value;
  const serviceCat = SERVICE_CATS.find((c) => c.re.test(text))?.value;
  if (productCat) notes.push(`Categoria produto: ${productCat}`);
  if (serviceCat) notes.push(`Categoria serviço: ${serviceCat}`);

  const q = stripFilterTerms(text) || undefined;
  if (q) notes.push(`Termo de busca: ${q}`);

  const productFilters: PublicProductFilters = {
    q,
    species,
    category: productCat,
    minPrice,
    maxPrice,
    inStock: true,
    pageSize: 12,
  };

  const serviceFilters: PublicServiceFilters = {
    q,
    species,
    category: serviceCat,
    minPrice,
    maxPrice,
    pageSize: 12,
  };

  return {
    intent,
    productFilters,
    serviceFilters,
    interpretation: notes,
    suggestedQuery: q ?? text,
  };
}
