import "server-only";

import { getToolCatalogSnapshot } from "./tool-registry";
import { FUNCTION_CALLING_READY } from "./function-calling";
import { getAiCache } from "./cache";

export async function getBusinessAiDiagnostics() {
  const tools = getToolCatalogSnapshot();
  return {
    modules: [
      "marketplace",
      "mypet",
      "agenda",
      "partners",
      "ngo",
      "social",
      "profile",
      "notifications",
      "maps",
      "admin",
      "orders",
      "cart",
      "support",
    ],
    toolsCount: tools.length,
    tools: tools.map((t) => ({
      name: t.name,
      modules: t.modules,
      personas: t.personas,
      readOnly: t.readOnly,
    })),
    functionCalling: FUNCTION_CALLING_READY,
    memory: {
      shortTerm: true,
      longTermSummary: true,
      extractiveSummary: true,
      cleanup: true,
    },
    rag: {
      abstractionReady: true,
      embeddingsEnabledByDefault: false,
      vectorDb: false,
    },
    cache: {
      backend: "memory",
      redisReady: true,
      probe: Boolean(getAiCache()),
    },
    generatedAt: new Date().toISOString(),
  };
}
