export type ExploreTarget =
  | "products"
  | "services"
  | "partners"
  | "ngos"
  | "adoptions"
  | "campaigns"
  | "social"
  | "mixed";

export type ExplorePlan = {
  target: ExploreTarget;
  interpretation: string[];
  deepLink: string;
};

export function parseExploreIntent(message: string): ExplorePlan {
  const text = message.trim();
  const notes: string[] = [];

  if (/\b(ong|protetor|abrigo)\b/i.test(text)) {
    notes.push("Busca por ONGs/protetores");
    return { target: "ngos", interpretation: notes, deepLink: "/ongs" };
  }
  if (/\b(adotar|adoção|adocao|filhote)\b/i.test(text)) {
    notes.push("Intenção de adoção");
    return { target: "adoptions", interpretation: notes, deepLink: "/adocoes" };
  }
  if (/\b(campanha|doação|doacao|urgente)\b/i.test(text)) {
    notes.push("Campanhas/doações");
    return { target: "campaigns", interpretation: notes, deepLink: "/campanhas" };
  }
  if (/\b(publicação|publicacao|post|rede\s*social|cuidados)\b/i.test(text)) {
    notes.push("Conteúdo social");
    return { target: "social", interpretation: notes, deepLink: "/social" };
  }
  if (/\b(parceiro|parceiros|petshop|clínica|clinica|próximos?|proximos?|perto)\b/i.test(text)) {
    notes.push("Parceiros próximos/catálogo");
    return { target: "partners", interpretation: notes, deepLink: "/parceiros" };
  }
  if (/\b(serviço|servico|banho|tosa|veterin)/i.test(text)) {
    notes.push("Serviços");
    return { target: "services", interpretation: notes, deepLink: "/marketplace?tab=services" };
  }
  if (/\b(produtos?|ração|racao|comprar)\b/i.test(text)) {
    notes.push("Produtos");
    return { target: "products", interpretation: notes, deepLink: "/marketplace" };
  }

  notes.push("Exploração mista (marketplace)");
  return { target: "mixed", interpretation: notes, deepLink: "/explorar" };
}
