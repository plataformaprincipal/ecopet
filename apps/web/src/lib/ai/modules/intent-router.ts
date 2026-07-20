import type { AssistantPersona } from "@/lib/ai/assistant/types";
import type { BusinessModule, BusinessToolName } from "./types";

export type IntentPlan = {
  module: BusinessModule;
  tools: Array<{ name: BusinessToolName; params: Record<string, unknown> }>;
};

function extractQuery(message: string): string {
  const cleaned = message
    .replace(
      /\b(buscar|procure|procura|pesquisar|mostrar|liste|listar|quero|sobre|meu|minha|meus|minhas|the|find|search|buscar)\b/gi,
      " "
    )
    .replace(/[?!.,]/g, " ")
    .trim();
  return cleaned.slice(0, 80);
}

/**
 * Roteador heurístico (pré-Function Calling).
 * Seleciona até 2 ferramentas read-only com base na mensagem + persona.
 */
export function planToolsFromMessage(
  message: string,
  persona: AssistantPersona
): IntentPlan {
  const s = message.toLowerCase();
  const q = extractQuery(message);
  const tools: IntentPlan["tools"] = [];
  let bizModule: BusinessModule = "general";

  const push = (name: BusinessToolName, params: Record<string, unknown> = {}) => {
    if (tools.some((t) => t.name === name)) return;
    if (tools.length >= 2) return;
    tools.push({ name, params });
  };

  if (/(carrinho|cart|cesta)/.test(s)) {
    bizModule = "cart";
    if (persona === "CLIENT" || persona === "ADMIN") push("consult_cart");
  }

  if (/(pedido|order|compra)/.test(s)) {
    bizModule = "orders";
    if (persona !== "ONG") push("consult_orders");
  }

  if (/(produto|ração|racao|petisco|marketplace|comprar|preço|preco|product)/.test(s)) {
    bizModule = "marketplace";
    push("consult_products", { query: q });
  }

  if (/(servi[çc]o|banho|tosa|veterin|consulta|service|grooming)/.test(s)) {
    if (bizModule === "general") bizModule = "marketplace";
    push("consult_services", { query: q });
  }

  if (/(agenda|agendamento|marcar|hor[aá]rio|appointment)/.test(s)) {
    bizModule = "agenda";
    if (persona !== "ONG") push("consult_agenda");
  }

  if (/(pet|meu pet|vacina|medicamento|lembrete|vermif|vaccine)/.test(s)) {
    bizModule = "mypet";
    if (persona === "CLIENT" || persona === "ADMIN") push("consult_pets");
  }

  if (/(notifica[çc]|notification|alerta)/.test(s)) {
    bizModule = "notifications";
    push("consult_notifications");
  }

  if (/(perfil|profile|conta|configura)/.test(s)) {
    bizModule = "profile";
    push("consult_profile");
  }

  if (/(parceiro|cl[ií]nica|petshop|partner|veterin[aá]rio)/.test(s) && persona === "CLIENT") {
    bizModule = "partners";
    push("consult_partners_public", { query: q });
  }

  if (persona === "PARTNER" && /(dashboard|pedido|estoque|avalia|relat[oó]rio|venda)/.test(s)) {
    bizModule = "partners";
    push("consult_partner_summary");
  }

  if (persona === "ONG" && /(animal|ado[çc]|campanha|doação|doacao|volunt)/.test(s)) {
    bizModule = "ngo";
    push("consult_ngo_summary");
  }

  if (/(social|hashtag|post|feed|rede)/.test(s)) {
    bizModule = "social";
    if (q.length >= 2) push("consult_social", { query: q });
  }

  if (persona === "ADMIN" && tools.length === 0 && /(usu[aá]rio|moder|den[uú]ncia|integra)/.test(s)) {
    bizModule = "admin";
    push("consult_profile");
  }

  return { module: bizModule, tools };
}

export function detectModuleFromPage(pagePath?: string): BusinessModule | null {
  if (!pagePath) return null;
  const p = pagePath.toLowerCase();
  if (p.includes("marketplace") || p.includes("produto")) return "marketplace";
  if (p.includes("meu-pet") || p.includes("pets") || p.includes("mypet")) return "mypet";
  if (p.includes("agenda") || p.includes("appointment")) return "agenda";
  if (p.includes("partner") || p.includes("parceiro")) return "partners";
  if (p.includes("ong") || p.includes("adocao") || p.includes("adoção")) return "ngo";
  if (p.includes("social")) return "social";
  if (p.includes("notif")) return "notifications";
  if (p.includes("perfil") || p.includes("profile") || p.includes("config")) return "profile";
  if (p.includes("admin")) return "admin";
  if (p.includes("carrinho") || p.includes("cart")) return "cart";
  if (p.includes("pedido") || p.includes("order")) return "orders";
  return null;
}
