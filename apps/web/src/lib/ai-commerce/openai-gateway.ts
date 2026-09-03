import "server-only";
import { toFile } from "openai";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import { withRetry } from "@/lib/ai/utils/retry";
import { AI_COMMERCE_LIMITS, AI_COMMERCE_MODELS, estimateOpenAiCostUsd } from "./models";
import { jsonSchemaByCapability, pfoAssistiveJsonSchema, schemaForCapability, normalizeCapability } from "./schemas";
import { systemPromptForCapability } from "./prompts";
import { AiCommerceError } from "./errors";

export type CommerceToolContext = {
  petProfile?: Record<string, unknown> | null;
  healthHistory?: Record<string, unknown> | null;
  previousReports?: unknown[];
  vaccinations?: unknown[];
  medications?: unknown[];
  petAIContext?: Record<string, unknown> | null;
};

export type GatewayImage = { mimeType: string; base64?: string; url?: string };
export type GatewayFile = { mimeType: string; url?: string; base64?: string; fileName?: string };

export type GatewayResult = {
  output: unknown;
  model: string;
  promptVersion: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  openaiResponseId?: string;
};

function extractOutputText(response: unknown): string {
  const r = response as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  if (r.output_text?.trim()) return r.output_text.trim();
  const parts = r.output?.flatMap((o) => o.content ?? []) ?? [];
  return parts.map((p) => p.text ?? "").join("").trim();
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function mapFailure(error: unknown): AiCommerceError {
  const msg = String((error as { message?: string })?.message ?? "");
  const status = (error as { status?: number })?.status;
  if (msg === "ANALYSIS_TIMEOUT" || msg.toLowerCase().includes("timeout")) {
    return new AiCommerceError("ANALYSIS_TIMEOUT", "A análise demorou além do esperado.", 504);
  }
  if (msg === "SCHEMA_MISMATCH" || msg === "INVALID_JSON" || msg === "EMPTY_OUTPUT") {
    return new AiCommerceError("RESULT_INVALID", "Não conseguimos organizar o resultado. Tente novamente.", 503);
  }
  if (status === 429) {
    return new AiCommerceError("AI_UNAVAILABLE", "O serviço OpenAI está temporariamente indisponível.", 503);
  }
  return new AiCommerceError(
    "AI_UNAVAILABLE",
    "Não conseguimos concluir sua análise agora. Sua utilização não foi consumida.",
    503
  );
}

export async function runStructuredCapability(params: {
  capabilityId: string;
  promptVersion: string;
  userPayload: unknown;
  images?: GatewayImage[];
  files?: GatewayFile[];
  context: CommerceToolContext;
  locale?: string;
  signal?: AbortSignal;
}): Promise<GatewayResult> {
  if (!AI_CONFIG.isConfigured) {
    throw new AiCommerceError("AI_UNAVAILABLE", "Não conseguimos concluir sua análise agora. Sua utilização não foi consumida.", 503);
  }
  const client = getOpenAIClient();
  const capabilityId = normalizeCapability(params.capabilityId);
  const schema = capabilityId.startsWith("pfo.")
    ? pfoAssistiveJsonSchema
    : jsonSchemaByCapability[capabilityId] ?? jsonSchemaByCapability["eccovet.assessment"];
  const model =
    capabilityId.includes("vision") || capabilityId.includes("exams") || capabilityId.includes("dental") || capabilityId.includes("vacina") || capabilityId.includes("eccomed")
      ? AI_COMMERCE_MODELS.vision
      : capabilityId.includes("report") || capabilityId.includes("profile")
        ? AI_COMMERCE_MODELS.complex
        : AI_COMMERCE_MODELS.default;

  const authorizedContext = {
    petAIContext: params.context.petAIContext ?? null,
    petProfile: params.context.petProfile ?? null,
    healthHistory: params.context.healthHistory ?? null,
    previousReports: params.context.previousReports ?? [],
    vaccinations: params.context.vaccinations ?? [],
    medications: params.context.medications ?? [],
  };

  const userText = JSON.stringify({
    locale: params.locale ?? "pt-BR",
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

  for (const file of params.files ?? []) {
    const isPdf = file.mimeType === "application/pdf";
    if (!isPdf) continue;
    try {
      let buffer: Buffer | null = file.base64 ? Buffer.from(file.base64, "base64") : null;
      if (!buffer && file.url) buffer = await fetchBuffer(file.url);
      if (!buffer) continue;
      const uploaded = await client.files.create({
        file: await toFile(buffer, file.fileName ?? "exame.pdf", { type: "application/pdf" }),
        purpose: "user_data",
      });
      content.push({ type: "input_file", file_id: uploaded.id });
    } catch {
      content.push({
        type: "input_text",
        text: "Um PDF foi enviado mas não pôde ser anexado ao modelo. Não invente o conteúdo do documento.",
      });
    }
  }

  const run = async () => {
    const created = client.responses.create({
      model,
      max_output_tokens: Math.max(AI_COMMERCE_LIMITS.maxOutputTokens, 2800),
      temperature: 0.2,
      instructions: systemPromptForCapability(params.capabilityId, params.locale ?? "pt-BR"),
      input: [{ role: "user", content: content as never }],
      text: {
        format: {
          type: "json_schema",
          name: capabilityId.replace(/\./g, "_").slice(0, 64),
          schema,
          strict: true,
        },
      },
    } as never);

    const timeoutMs = AI_COMMERCE_LIMITS.timeoutMs;
    const response = await Promise.race([
      created,
      new Promise<never>((_, reject) => {
        const t = setTimeout(() => reject(new Error("ANALYSIS_TIMEOUT")), timeoutMs);
        params.signal?.addEventListener("abort", () => {
          clearTimeout(t);
          reject(new Error("ANALYSIS_TIMEOUT"));
        });
      }),
    ]);

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
    const usage = (response as { id?: string; usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number } } }).usage;
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
      openaiResponseId: (response as { id?: string }).id,
    } satisfies GatewayResult;
  };

  try {
    return await withRetry(run, {
      maxAttempts: AI_COMMERCE_LIMITS.maxRetries + 1,
      baseDelayMs: 400,
      isRetryable: (error) => {
        const msg = String((error as { message?: string })?.message ?? "");
        if (msg === "ANALYSIS_TIMEOUT") return false;
        if (msg === "SCHEMA_MISMATCH") return true;
        if (msg === "INVALID_JSON" || msg === "EMPTY_OUTPUT") return true;
        const status = (error as { status?: number })?.status;
        return status === 429 || status === 408 || status === 500 || status === 502 || status === 503;
      },
    });
  } catch (e) {
    throw mapFailure(e);
  }
}

export async function runFollowUpMessage(params: {
  capabilityId: string;
  locale?: string;
  systemExtra: string;
  userMessage: string;
}): Promise<{ text: string; model: string; inputTokens: number; outputTokens: number }> {
  if (!AI_CONFIG.isConfigured) {
    throw new AiCommerceError("AI_UNAVAILABLE", "Não conseguimos responder agora.", 503);
  }
  const client = getOpenAIClient();
  const model = AI_COMMERCE_MODELS.default;
  const response = await client.responses.create({
    model,
    max_output_tokens: 800,
    temperature: 0.3,
    instructions: `${systemPromptForCapability(params.capabilityId, params.locale ?? "pt-BR")}
Você está no chat secundário sobre uma análise já concluída.
Não recomece do zero. Use o contexto abaixo.
Não prescreva. Não altere doses. Não invente fatos.
${params.systemExtra}`,
    input: [{ role: "user", content: [{ type: "input_text", text: params.userMessage }] }],
  } as never);
  const text = extractOutputText(response) || "Não consegui detalhar isso agora.";
  const usage = (response as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
  return {
    text,
    model,
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
  };
}
