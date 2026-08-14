/**
 * Chat público da EccoPet AI para visitantes (sem sessão).
 * Só consulta dados públicos; nunca toca dados de conta e nunca inventa registros.
 */
import "server-only";

import { AI_CONFIG, normalizeLocale, type AiLocale } from "@/lib/ai/ai-config";
import { classifyProviderErrorForLog } from "@/lib/ai/ai-errors";
import { moderateContent, moderateAiOutput } from "@/lib/ai/ai-moderation";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { AI_SAFETY_DISCLAIMER } from "@/lib/ai/ai-disclaimer";
import {
  buildGuestContextBlock,
  buildGuestSystemPrompt,
  classifyGuestIntent,
  guestSignInMessage,
  guestUnavailableMessage,
  sanitizeGuestMessage,
  type PublicGuestTopic,
} from "@/lib/ai/public-guest-intent";
import {
  readAdoptions,
  readPublicProducts,
  readPublicServices,
  readTrending,
} from "@/lib/ai/modules/services/domain-reads";

/** Visitante tem janela menor que o usuário autenticado. */
const GUEST_MAX_MESSAGE_CHARS = 1_200;
const GUEST_MAX_OUTPUT_TOKENS = 600;

export type PublicGuestChatDiag = {
  fallbackReason: string;
  provider?: string;
  providerStatus?: number | null;
  providerCode?: string;
  providerMessage?: string;
};

export type PublicGuestChatResult = {
  reply: string;
  available: boolean;
  /** true quando a resposta pediu login em vez de responder com dados. */
  requiresSignIn: boolean;
  topics: PublicGuestTopic[];
  /** Somente diagnóstico server-side — não expor ao cliente. */
  _diag?: PublicGuestChatDiag;
};

export function guestMaxMessageChars(): number {
  return Math.min(GUEST_MAX_MESSAGE_CHARS, AI_CONFIG.maxInputChars);
}

export async function runPublicGuestChat(input: {
  message: string;
  locale?: string;
  pagePath?: string;
  lat?: number;
  lng?: number;
}): Promise<PublicGuestChatResult> {
  const locale: AiLocale = normalizeLocale(input.locale);
  const message = sanitizeGuestMessage(input.message, guestMaxMessageChars());

  if (!message) {
    return {
      reply: guestUnavailableMessage(locale),
      available: true,
      requiresSignIn: false,
      topics: [],
    };
  }

  const intent = classifyGuestIntent(message);
  if (intent.kind === "private") {
    return {
      reply: guestSignInMessage(locale),
      available: true,
      requiresSignIn: true,
      topics: [],
    };
  }

  if (!AI_CONFIG.isConfigured) {
    const diag: PublicGuestChatDiag = {
      fallbackReason: "AI_NOT_CONFIGURED",
      provider: "openai",
      providerCode: "AI_NOT_CONFIGURED",
      providerMessage: `globallyEnabled=${AI_CONFIG.globallyEnabled} apiKeyPresent=${Boolean(AI_CONFIG.apiKey)}`,
    };
    console.warn("[public-guest-chat] fallback", diag);
    return {
      reply: guestUnavailableMessage(locale),
      available: false,
      requiresSignIn: false,
      topics: intent.topics,
      _diag: diag,
    };
  }

  const moderation = await moderateContent(message);
  if (moderation.decision === "BLOCK") {
    return {
      reply: moderation.reason ?? "Conteúdo bloqueado pelas políticas de segurança.",
      available: true,
      requiresSignIn: false,
      topics: [],
    };
  }

  const sections = await loadPublicSections(intent.topics, message, {
    lat: input.lat,
    lng: input.lng,
  });
  const contextBlock = buildGuestContextBlock(sections);

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: AI_CONFIG.model,
      temperature: 0.4,
      max_tokens: Math.min(GUEST_MAX_OUTPUT_TOKENS, AI_CONFIG.maxOutputTokens),
      messages: [
        { role: "system", content: buildGuestSystemPrompt(locale) },
        ...(contextBlock ? [{ role: "system" as const, content: contextBlock }] : []),
        ...(input.pagePath
          ? [{ role: "system" as const, content: `Página atual do visitante: ${input.pagePath}` }]
          : []),
        { role: "user", content: message },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!raw) {
      const diag: PublicGuestChatDiag = {
        fallbackReason: "OPENAI_EMPTY_RESPONSE",
        provider: "openai",
        providerCode: "EMPTY_COMPLETION",
      };
      console.warn("[public-guest-chat] fallback", diag);
      return {
        reply: guestUnavailableMessage(locale),
        available: false,
        requiresSignIn: false,
        topics: intent.topics,
        _diag: diag,
      };
    }

    const outMod = await moderateAiOutput(raw);
    if (outMod.decision === "BLOCK") {
      return {
        reply: outMod.reason ?? "Conteúdo bloqueado pelas políticas de segurança.",
        available: true,
        requiresSignIn: false,
        topics: intent.topics,
      };
    }

    const disclaimer = AI_SAFETY_DISCLAIMER[locale];
    const reply = raw.includes(disclaimer.slice(0, 40)) ? raw : `${raw}\n\n—\n${disclaimer}`;

    return { reply, available: true, requiresSignIn: false, topics: intent.topics };
  } catch (error) {
    const classified = classifyProviderErrorForLog(error);
    const diag: PublicGuestChatDiag = {
      fallbackReason: "OPENAI_PROVIDER_ERROR",
      provider: classified.provider,
      providerStatus: classified.status,
      providerCode: classified.code,
      providerMessage: classified.message,
    };
    console.warn("[public-guest-chat] fallback", diag);
    return {
      reply: guestUnavailableMessage(locale),
      available: false,
      requiresSignIn: false,
      topics: intent.topics,
      _diag: diag,
    };
  }
}

async function loadPublicSections(
  topics: PublicGuestTopic[],
  message: string,
  geo?: { lat?: number; lng?: number }
) {
  if (!topics.length) return [];
  const query = extractPublicQuery(message);
  const species = detectSpecies(message);
  const geoOpts =
    geo?.lat != null && geo?.lng != null ? { lat: geo.lat, lng: geo.lng, radiusKm: 50 } : undefined;

  const sections = await Promise.all(
    topics.map(async (topic) => {
      try {
        return { topic, data: await readPublicTopic(topic, query, species, geoOpts) };
      } catch {
        return { topic, data: null };
      }
    })
  );
  return sections;
}

async function readPublicTopic(
  topic: PublicGuestTopic,
  query: string,
  species: string | undefined,
  geo?: { lat?: number; lng?: number; radiusKm?: number }
): Promise<unknown> {
  switch (topic) {
    case "products":
      return readPublicProducts(query, geo);
    case "services":
      return readPublicServices(query, geo);
    case "adoptions":
      return readAdoptions(species ? { species } : {});
    case "trending":
      return readTrending();
  }
}

function detectSpecies(message: string): string | undefined {
  if (/\b(gato|gata|gatinho|felin|cat|kitten)\w*/i.test(message)) return "CAT";
  if (/\b(cachorro|cadela|c[ãa]o|filhote|canin|dog|puppy)\w*/i.test(message)) return "DOG";
  if (/\b(p[áa]ssaro|ave|bird)\w*/i.test(message)) return "BIRD";
  return undefined;
}

function extractPublicQuery(message: string): string {
  return message
    .replace(/\b(procure|procura|buscar|busca|pesquisar|mostre|mostrar|liste|listar|quero|find|search|show|list)\b/gi, " ")
    .replace(/[?!.,;]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 80);
}
