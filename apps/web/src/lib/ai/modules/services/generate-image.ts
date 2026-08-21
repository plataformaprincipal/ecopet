import "server-only";

import { getOpenAIClient } from "@/lib/ai/openai-client";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { writeAiAuditLog } from "@/lib/ai/ai-audit";
import { isCloudinaryConfigured, uploadBuffer } from "@/lib/upload/cloudinary";

const IMAGE_DAILY_LIMIT = 5;
const IMAGE_BURST_LIMIT = 1;
const IMAGE_BURST_WINDOW_MS = 20_000;

export class ImageGenerationLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageGenerationLimitError";
  }
}

export async function generateAiImage(params: {
  userId: string;
  role: string;
  prompt: string;
}): Promise<{ url: string; prompt: string; revisedPrompt?: string }> {
  const prompt = params.prompt.trim().slice(0, 1000);
  if (prompt.length < 3) {
    throw new Error("Descreva a imagem com mais detalhes.");
  }

  const burstOk = await checkDistributedRateLimit(
    `ai-image-burst:${params.userId}`,
    IMAGE_BURST_LIMIT,
    IMAGE_BURST_WINDOW_MS
  );
  const dailyOk = await checkDistributedRateLimit(
    `ai-image-day:${params.userId}`,
    IMAGE_DAILY_LIMIT,
    24 * 60 * 60 * 1000
  );
  if (!burstOk || !dailyOk) {
    await writeAiAuditLog({
      userId: params.userId,
      role: params.role as never,
      module: "ecopet-ai",
      action: "tool:generate_image",
      decision: "DENY",
      metadata: { reason: "rate_limit" },
    }).catch(() => undefined);
    throw new ImageGenerationLimitError(
      "Você atingiu o limite de geração de imagens. Tente novamente mais tarde."
    );
  }

  const client = getOpenAIClient();
  const result = await client.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
    response_format: "b64_json",
  });

  const first = result.data?.[0];
  const b64 = first?.b64_json;
  if (!b64) {
    throw new Error("Não foi possível gerar a imagem agora.");
  }

  const buffer = Buffer.from(b64, "base64");
  let url = `data:image/png;base64,${b64}`;
  if (isCloudinaryConfigured()) {
    try {
      const uploaded = await uploadBuffer({
        purpose: "ai_attachment",
        buffer,
        mimeType: "image/png",
        fileName: `eccopet-ai-${Date.now()}.png`,
        ownerId: params.userId,
      });
      if (uploaded.url) url = uploaded.url;
    } catch {
      /* data URL fallback — never expose API key */
    }
  }

  await writeAiAuditLog({
    userId: params.userId,
    role: params.role as never,
    module: "ecopet-ai",
    action: "tool:generate_image",
    decision: "ALLOW",
    metadata: { promptLength: prompt.length },
  }).catch(() => undefined);

  return {
    url,
    prompt,
    revisedPrompt: first.revised_prompt ?? undefined,
  };
}
