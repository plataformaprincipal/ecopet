import type { AiAgentId, AiPromptDefinition } from "@/lib/ai/types";

const prompts = new Map<string, AiPromptDefinition>();

function promptKey(key: string, version: string) {
  return `${key}@${version}`;
}

export function registerPrompt(definition: AiPromptDefinition) {
  prompts.set(promptKey(definition.key, definition.version), definition);
}

export function getPrompt(key: string, version: string): AiPromptDefinition | null {
  return prompts.get(promptKey(key, version)) ?? null;
}

export function listPrompts(filter?: { agentId?: AiAgentId; activeOnly?: boolean }) {
  return [...prompts.values()].filter((p) => {
    if (filter?.agentId && p.agentId !== filter.agentId) return false;
    if (filter?.activeOnly && !p.isActive) return false;
    return true;
  });
}

export function getLatestPrompt(key: string): AiPromptDefinition | null {
  const matches = [...prompts.values()]
    .filter((p) => p.key === key)
    .sort((a, b) => b.version.localeCompare(a.version));
  return matches[0] ?? null;
}

function basePrompt(agentId: AiAgentId, name: string, category: string, focus: string): AiPromptDefinition {
  const key = `agent.${agentId}`;
  return {
    id: `${key}.v1`,
    key,
    name,
    category,
    version: "1.0.0",
    content: `Você é o assistente de IA do EcoPet para ${name}.
Foco: ${focus}
Regras: responda em português brasileiro; seja preciso; nunca invente dados; respeite LGPD.`,
    recommendedModel: agentId === "admin" || agentId === "analytics" ? "gpt-4o" : "gpt-4o-mini",
    temperature: 0.7,
    isActive: true,
    agentId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function bootstrapPromptRegistry() {
  const defs: AiPromptDefinition[] = [
    basePrompt("client", "Tutor", "cliente", "pets, marketplace e navegação"),
    basePrompt("partner", "Parceiro", "parceiro", "serviços, produtos e pedidos"),
    basePrompt("ngo", "ONG", "ong", "adoções e campanhas"),
    basePrompt("admin", "Administrador", "admin", "gestão e moderação"),
    basePrompt("marketplace", "Marketplace", "marketplace", "produtos e serviços"),
    basePrompt("veterinarian", "Veterinário", "saude", "saúde animal"),
    basePrompt("pet", "Meu Pet", "pet", "cuidados com o pet"),
    basePrompt("marketing", "Marketing", "marketing", "campanhas e conteúdo"),
    basePrompt("finance", "Financeiro", "financeiro", "pagamentos e indicadores"),
    basePrompt("legal", "Jurídico", "juridico", "termos e conformidade"),
    basePrompt("commercial", "Comercial", "comercial", "CRM e vendas"),
    basePrompt("support", "Suporte", "suporte", "atendimento e tickets"),
    basePrompt("analytics", "Analytics", "analytics", "métricas e relatórios"),
  ];
  for (const d of defs) registerPrompt(d);
}

bootstrapPromptRegistry();
