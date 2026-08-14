/**
 * Placeholders consistentes por domínio — evita repetir a mesma foto Unsplash.
 * São ilustrações genéricas SVG (data URI), não fotos de animais específicos.
 */

function svgPlaceholder(label: string, hue: number): string {
  const bg = `hsl(${hue} 35% 92%)`;
  const fg = `hsl(${hue} 40% 35%)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${bg}"/>
  <circle cx="400" cy="250" r="72" fill="${fg}" opacity="0.2"/>
  <text x="400" y="380" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" fill="${fg}">${label}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const PET_FALLBACKS: Record<string, string> = {
  DOG: svgPlaceholder("Cachorro · foto pendente", 25),
  CAT: svgPlaceholder("Gato · foto pendente", 210),
  BIRD: svgPlaceholder("Ave · foto pendente", 45),
  RABBIT: svgPlaceholder("Coelho · foto pendente", 300),
  RODENT: svgPlaceholder("Roedor · foto pendente", 160),
  FISH: svgPlaceholder("Peixe · foto pendente", 190),
  OTHER: svgPlaceholder("Pet · foto pendente", 140),
};

const PRODUCT_FALLBACKS: Record<string, string> = {
  FOOD: svgPlaceholder("Alimentação", 30),
  HYGIENE: svgPlaceholder("Higiene", 180),
  TOYS: svgPlaceholder("Brinquedos", 320),
  HEALTH: svgPlaceholder("Saúde", 0),
  ACCESSORIES: svgPlaceholder("Acessórios", 260),
  TRANSPORT: svgPlaceholder("Transporte", 200),
  OTHER: svgPlaceholder("Produto", 150),
};

const SERVICE_FALLBACKS: Record<string, string> = {
  BANHO: svgPlaceholder("Banho", 200),
  TOSA: svgPlaceholder("Tosa", 280),
  CONSULTA_VET: svgPlaceholder("Veterinário", 0),
  HOSPEDAGEM: svgPlaceholder("Hotel pet", 220),
  PASSEIO: svgPlaceholder("Passeio", 100),
  ADESTRAMENTO: svgPlaceholder("Adestramento", 40),
  OTHER: svgPlaceholder("Serviço", 160),
};

const ADOPTION_FALLBACK = svgPlaceholder("Foto ainda não cadastrada", 140);

export function petImageFallback(species?: string | null): string {
  const key = (species || "OTHER").toUpperCase();
  return PET_FALLBACKS[key] ?? PET_FALLBACKS.OTHER;
}

export function productImageFallback(category?: string | null): string {
  const key = (category || "OTHER").toUpperCase();
  return PRODUCT_FALLBACKS[key] ?? PRODUCT_FALLBACKS.OTHER;
}

export function serviceImageFallback(category?: string | null): string {
  const key = (category || "OTHER").toUpperCase();
  return SERVICE_FALLBACKS[key] ?? SERVICE_FALLBACKS.OTHER;
}

export function adoptionImageFallback(): string {
  return ADOPTION_FALLBACK;
}

export function resolveMediaUrl(
  url: string | null | undefined,
  fallback: string
): string {
  if (!url || !url.trim()) return fallback;
  return url;
}
