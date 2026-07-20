import type { AiLocale } from "@/lib/ai/ai-config";
import { AI_SAFETY_DISCLAIMER } from "@/lib/ai/ai-config";
import { getModuleSystemPrompt } from "@/lib/ai/ai-prompts";
import { getPersonaScopeLines } from "./personas";
import type { AssistantPersona } from "./types";

export function buildAssistantSystemPrompt(input: {
  persona: AssistantPersona;
  locale: AiLocale;
  userDisplayName?: string | null;
}): string {
  const localeLine =
    input.locale === "en-US"
      ? "Respond in English."
      : input.locale === "es-ES"
        ? "Responde en español."
        : "Responda em português do Brasil.";

  const nameLine = input.userDisplayName
    ? `Usuário autenticado (primeiro nome): ${input.userDisplayName}.`
    : "Usuário autenticado.";

  return [
    getModuleSystemPrompt("ecopet-ai", input.locale),
    localeLine,
    nameLine,
    ...getPersonaScopeLines(input.persona),
    "Não invente funcionalidades inexistentes. Oriente com base no EcoPet real.",
    "Nunca peça ou repita senhas, JWT, cookies, CPF, cartões ou secrets.",
    `Disclaimer de bem-estar:\n${AI_SAFETY_DISCLAIMER[input.locale]}`,
  ].join("\n\n");
}
