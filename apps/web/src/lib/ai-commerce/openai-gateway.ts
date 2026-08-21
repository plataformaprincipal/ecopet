import "server-only";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import { withRetry } from "@/lib/ai/utils/retry";
import { AI_COMMERCE_LIMITS, AI_COMMERCE_MODELS, estimateOpenAiCostUsd } from "./models";
import { jsonSchemaByCapability, schemaForCapability, normalizeCapability } from "./schemas";
import { systemPromptForCapability } from "./prompts";
import { AiCommerceError } from "./errors";

export type CommerceToolContext = {
  petProfile?: Record<string, unknown> | null;
  healthHistory?: Record<string, unknown> | null;
  previousReports?: unknown[];
  vaccinations?: unknown[];
  medications?: unknown[];
};

export type GatewayImage = { mimeType: string; base64?: string; url?: string };

export type GatewayResult = {
  output: unknown;
  model: string;
  promptVersion: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
};

function extractOutputText(response: unknown): string {
  const r = response as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  if (r.output_text?.trim()) return r.output_text.trim();
  const parts = r.output?.flatMap((o) => o.content ?? []) ?? [];
  return parts.map((p) => p.text ?? "").join("").trim();
}

export async function runStructuredCapability(params: {
  capabilityId: string;
  promptVersion: string;
  userPayload: unknown;
  images?: GatewayImage[];
  context: CommerceToolContext;
}): Promise<GatewayResult> {
  if (!AI_CONFIG.isConfigured) {
    throw new AiCommerceError("AI_UNAVAILABLE", "Não conseguimos concluir sua análise agora. Sua utilização não foi consumida.", 503);
  }
  const client = getOpenAIClient();
  const capabilityId = normalizeCapability(params.capabilityId);
  const schema = jsonSchemaByCapability[capabilityId] ?? jsonSchemaByCapability["eccovet.assessment"];
  const model =
    capabilityId.includes("vision") || capabilityId.includes("exams") || capabilityId.includes("dental")
      ? AI_COMMERCE_MODELS.vision
      : capabilityId.includes("report") || capabilityId.includes("profile")
        ? AI_COMMERCE_MODELS.complex
        : AI_COMMERCE_MODELS.default;

  const authorizedContext = {
    petProfile: params.context.petProfile ?? null,
    healthHistory: params.context.healthHistory ?? null,
    previousReports: params.context.previousReports ?? [],
    vaccinations: params.context.vaccinations ?? [],
    medications: params.context.medications ?? [],
  };

  const userText = JSON.stringify({
    input: params.userPayload,
    authorizedContext,
  });

  const content: Array<Record<string, unknown>> = [{ type: "input_text", text: userText }];
  for (const img of params.images ?? []) {
    if (img.url) {
      content.push({ type: "input_image", image_url: img.url });
    } else if (img.base64) {
      content.push({
        type: "input_image",
        image_url: `data:${img.mimeType};base64,${img.base64}`,
      });
    }
  }

  const run = async () => {
    const response = await client.responses.create({
      model,
      max_output_tokens: AI_COMMERCE_LIMITS.maxOutputTokens,
      temperature: 0.2,
      instructions: systemPromptForCapability(params.capabilityId),
      input: [{ role: "user", content: content as never }],
      text: {
        format: {
          type: "json_schema",
          name: capabilityId.replace(/\./g, "_"),
          schema,
          strict: true,
        },
      },
    } as never);
    const text = extractOutputText(response);
    if (!text) throw new Error("EMPTY_OUTPUT");
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("INVALID_JSON");
    }
    const zod = schemaForCapability(params.capabilityId);
    const validated = zod.safeParse(parsed);
    if (!validated.success) throw new Error("SCHEMA_MISMATCH");
    const usage = (response as { usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number } } }).usage;
    const inputTokens = usage?.input_tokens ?? 0;
    const cachedInputTokens = usage?.input_tokens_details?.cached_tokens ?? 0;
    const outputTokens = usage?.output_tokens ?? 0;
    return {
      output: validated.data,
      model,
      promptVersion: params.promptVersion,
      inputTokens,
      cachedInputTokens,
      outputTokens,
      estimatedCostUsd: estimateOpenAiCostUsd({ model, inputTokens, cachedInputTokens, outputTokens }),
    } satisfies GatewayResult;
  };

  try {
    return await withRetry(run, {
      maxAttempts: AI_COMMERCE_LIMITS.maxRetries + 1,
      baseDelayMs: 400,
      isRetryable: (error) => {
        const msg = String((error as { message?: string })?.message ?? "");
        if (msg === "INVALID_JSON" || msg === "SCHEMA_MISMATCH" || msg === "EMPTY_OUTPUT") return true;
        const status = (error as { status?: number })?.status;
        return status === 429 || status === 408 || status === 500 || status === 502 || status === 503;
      },
    });
  } catch {
    throw new AiCommerceError(
      "AI_UNAVAILABLE",
      "Não conseguimos concluir sua análise agora. Sua utilização não foi consumida.",
      503
    );
  }
}
