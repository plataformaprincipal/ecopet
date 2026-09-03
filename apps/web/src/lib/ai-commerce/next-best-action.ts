import { AI_COMMERCE_PRODUCTS, getProductDefBySku, getProductDefBySlug } from "./catalog";

export type NextBestAction = {
  sku: string;
  capabilityId: string;
  slug: string;
  href: string;
  label: string;
  reason: string;
};

function productAction(sku: string, reason: string): NextBestAction | null {
  const def = getProductDefBySku(sku);
  if (!def) return null;
  return {
    sku: def.sku,
    capabilityId: def.capabilityId,
    slug: def.slug,
    href: def.href,
    label: `Abrir ${def.name}`,
    reason,
  };
}

function blob(output: Record<string, unknown> | null | undefined): string {
  if (!output) return "";
  try {
    return JSON.stringify(output).toLowerCase();
  } catch {
    return "";
  }
}

export function computeNextBestAction(params: {
  sku: string;
  output?: Record<string, unknown> | null;
  input?: Record<string, unknown> | null;
}): NextBestAction | null {
  const def = getProductDefBySku(params.sku);
  if (!def) return null;
  const text = `${blob(params.output)} ${blob(params.input)}`;
  const kind = def.workspaceKind;

  if (kind === "assessment") {
    if (/dent|tártaro|tartaro|halitose|gengiva|oral/.test(text)) return productAction("AI_ECCODENTAL", "A análise clínica apontou questão oral.");
    if (/peso|emagrec|obes|nutri|ração|racao/.test(text)) return productAction("AI_ECCONUTRI", "Há contexto alimentar ou de peso para aprofundar.");
    if (/exame|hemograma|laudo/.test(text)) return productAction("AI_ECCOVET_EXAMS", "Documentos de exame podem ser estruturados.");
    return productAction("AI_ECCOVET_REPORT", "Gerar um relatório organizado para a consulta.");
  }
  if (kind === "triage") {
    return {
      sku: "AI_ECCOVET_TRIAGE",
      capabilityId: "eccovet.triage",
      slug: "emergencia",
      href: "/marketplace/emergencia",
      label: "Emergência",
      reason: "Se a triagem apontou urgência, a Bubis continua o atendimento.",
    };
  }
  if (kind === "vision") {
    if (/dent|boca|dente/.test(text)) return productAction("AI_ECCODENTAL", "A região visível sugere avaliação oral dedicada.");
    return productAction("AI_ECCOVET", "Levar o resumo visual para uma análise clínica estruturada.");
  }
  if (kind === "dental") return productAction("AI_ECCOCHECKUP", "Incluir saúde oral no checkup preventivo.");
  if (kind === "exams") return productAction("AI_ECCOVET_REPORT", "Gerar um relatório para levar ao veterinário.");
  if (kind === "peso") return productAction("AI_ECCONUTRI", "Acompanhar peso com orientação nutricional.");
  if (kind === "nutri") return productAction("AI_ECCOPESO", "Registrar a evolução de peso junto da rotina alimentar.");
  if (kind === "behavior") return productAction("AI_PET_HEALTH_PROFILE", "Adicionar o padrão comportamental ao histórico.");
  if (kind === "vaccine") return productAction("AI_ECCOCHECKUP", "Revisar prevenção e pendências no checkup.");
  if (kind === "med") return productAction("AI_PET_HEALTH_PROFILE", "Incluir o plano de medicamentos no dossiê.");
  if (kind === "checkup") {
    if (/vacin/.test(text)) return productAction("AI_ECCOVACCINE", "Há pendência vacinal para organizar.");
    if (/peso/.test(text)) return productAction("AI_ECCOPESO", "Há ponto de peso para acompanhar.");
    if (/oral|dent/.test(text)) return productAction("AI_ECCODENTAL", "Há ponto oral para analisar.");
    return productAction("AI_ECCOVET", "Aprofundar um ponto do checkup na avaliação clínica.");
  }
  if (kind === "report") return productAction("AI_PET_HEALTH_PROFILE", "Guardar o relatório no dossiê do pet.");
  if (kind === "profile") return productAction("AI_ECCOCHECKUP", "Atualizar o checkup com as lacunas do perfil.");
  return null;
}

export function crossModuleActionsFor(sku: string): Array<{ sku: string; href: string; label: string }> {
  const nba = computeNextBestAction({ sku });
  const profile = getProductDefBySlug("health-profile");
  const items = [
    nba ? { sku: nba.sku, href: nba.href, label: nba.label } : null,
    profile && sku !== "AI_PET_HEALTH_PROFILE" ? { sku: profile.sku, href: profile.href, label: "Adicionar ao Health Profile" } : null,
  ].filter(Boolean) as Array<{ sku: string; href: string; label: string }>;
  const seen = new Set<string>();
  return items.filter((i) => {
    if (seen.has(i.sku)) return false;
    seen.add(i.sku);
    return true;
  });
}

export const ALL_CAPABILITY_IDS = AI_COMMERCE_PRODUCTS.map((p) => p.capabilityId);
