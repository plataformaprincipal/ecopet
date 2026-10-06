/**
 * Prompt builder — evita concatenação ad hoc em componentes.
 * Fundação apenas; não implementa assistentes de domínio.
 */

export type PromptModule =
  | "assistant"
  | "marketplace"
  | "partner"
  | "ong"
  | "pets"
  | "admin"
  | "foundation";

export type BuiltPrompt = {
  module: PromptModule;
  system: string;
  user: string;
  version: number;
};

const SYSTEM_PREFACES: Record<PromptModule, string> = {
  assistant: "Você é o assistente EccoPet. Respostas objetivas e seguras.",
  marketplace: "Contexto marketplace EccoPet. Não invente preços ou estoque.",
  partner: "Contexto parceiro EccoPet. Não altere regras de negócio.",
  ong: "Contexto ONG EccoPet. Linguagem respeitosa sobre adoção/doação.",
  pets: "Contexto Meu Pet. Não substitua orientação veterinária presencial.",
  admin: "Contexto administrativo interno EccoPet. Sem dados sensíveis.",
  foundation: "Teste de fundação EccoPet. Resposta mínima.",
};

export function buildPrompt(input: {
  module: PromptModule;
  user: string;
  extraSystem?: string;
}): BuiltPrompt {
  const base = SYSTEM_PREFACES[input.module];
  const system = input.extraSystem ? `${base}\n${input.extraSystem}` : base;
  return {
    module: input.module,
    system,
    user: String(input.user ?? "").slice(0, 4_000),
    version: 1,
  };
}
