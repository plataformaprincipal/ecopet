import "server-only";

import { AI_SAFETY_DISCLAIMER } from "@/lib/ai/ai-config";
import { buildMinimalContext } from "@/lib/ai/ai-context";
import type { BusinessContext, BusinessContextInput, BusinessModule } from "./types";
import { buildBusinessSystemPrompt } from "./module-prompts";
import { planToolsFromMessage, detectModuleFromPage } from "./intent-router";
import { executeBusinessTools } from "./tool-executor";
import { enrichPromptWithToolResults } from "./response-enricher";
import { loadActiveConversationMemory } from "./conversation-memory";
import { buildSemanticContextStub } from "./semantic-context";
import { estimateTokens, truncateToTokenBudget } from "./token-manager";

function mapAiModuleToBusiness(module?: string): BusinessModule | null {
  if (!module) return null;
  const map: Record<string, BusinessModule> = {
    marketplace: "marketplace",
    products: "marketplace",
    services: "marketplace",
    pets: "mypet",
    appointments: "agenda",
    partner: "partners",
    ong: "ngo",
    social: "social",
    profile: "profile",
    notifications: "notifications",
    orders: "orders",
    cart: "cart",
    admin: "admin",
    support: "support",
    "ecopet-ai": "general",
  };
  return map[module] ?? null;
}

/**
 * Construtor de contexto de negócio para o Assistente.
 * Combina persona, módulo, memória, ferramentas e (opcional) RAG stub.
 */
export async function buildBusinessContext(
  input: BusinessContextInput
): Promise<BusinessContext> {
  const pageModule = detectModuleFromPage(input.pagePath);
  const intent = planToolsFromMessage(input.message, input.persona);
  const activeModule =
    pageModule ??
    mapAiModuleToBusiness(typeof input.module === "string" ? input.module : undefined) ??
    intent.module;

  const [minimal, memory, toolResults, semantic] = await Promise.all([
    buildMinimalContext({
      userId: input.userId,
      role: input.role,
      module:
        activeModule === "mypet"
          ? "pets"
          : activeModule === "partners"
            ? "partner"
            : activeModule === "ngo"
              ? "ong"
              : activeModule === "agenda"
                ? "appointments"
                : activeModule === "marketplace"
                  ? "marketplace"
                  : "ecopet-ai",
      locale: input.locale,
      entityIds: {
        petId: input.petId,
        conversationId: input.conversationId,
      },
    }),
    loadActiveConversationMemory({
      userId: input.userId,
      petId: input.petId,
      conversationId: input.conversationId,
    }),
    intent.tools.length
      ? executeBusinessTools(intent.tools, {
          userId: input.userId,
          role: input.role,
          persona: input.persona,
          locale: input.locale,
        })
      : Promise.resolve([]),
    buildSemanticContextStub({
      query: input.message,
      enabled: false, // RAG completo desligado por padrão
      locale: input.locale,
    }),
  ]);

  const toolsBlock = enrichPromptWithToolResults(toolResults);
  const contextBlock = truncateToTokenBudget(
    [
      `Módulo ativo: ${activeModule}`,
      input.pagePath ? `Página: ${input.pagePath}` : "",
      memory.activeContext,
      minimal.text,
      toolsBlock,
      semantic.block,
    ]
      .filter(Boolean)
      .join("\n\n"),
    3_200
  );

  const systemPrompt = buildBusinessSystemPrompt({
    persona: input.persona,
    locale: input.locale,
    module: activeModule,
    displayName: input.displayName,
  });

  return {
    persona: input.persona,
    locale: input.locale,
    activeModule,
    pagePath: input.pagePath,
    systemPrompt,
    contextBlock,
    toolResults,
    toolsUsed: toolResults.filter((t) => t.executed && t.ok).map((t) => t.toolName),
    memorySummary: memory.longTermSummary,
    disclaimer: AI_SAFETY_DISCLAIMER[input.locale] ?? minimal.disclaimer,
    estimatedTokens: estimateTokens(systemPrompt) + estimateTokens(contextBlock),
  };
}
