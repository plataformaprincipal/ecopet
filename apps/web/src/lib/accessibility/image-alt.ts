/** Evita termos genéricos proibidos: imagem, foto, produto, serviço (isolados). */
export function productImageAlt(
  productName: string,
  options?: { index?: number; shortDescription?: string | null }
): string {
  const suffix = options?.index != null && options.index > 0 ? ` — vista ${options.index + 1}` : "";
  if (options?.shortDescription?.trim()) {
    return `${productName}: ${options.shortDescription.trim()}${suffix}`;
  }
  return `${productName} disponível no catálogo EcoPet${suffix}`;
}

export function serviceImageAlt(serviceName: string, shortDescription?: string | null): string {
  if (shortDescription?.trim()) {
    return `${serviceName}: ${shortDescription.trim()}`;
  }
  const lower = serviceName.toLowerCase();
  if (lower.includes("banho")) {
    return "Serviço de banho pet com agendamento online";
  }
  if (lower.includes("tosa")) {
    return "Serviço de tosa pet com agendamento online";
  }
  return `${serviceName} com agendamento online no EcoPet`;
}

export function avatarAlt(name: string): string {
  return `Perfil de ${name}`;
}

export const DECORATIVE_ALT = "";
