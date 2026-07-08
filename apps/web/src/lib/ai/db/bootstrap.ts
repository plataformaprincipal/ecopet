import { prisma } from "@/lib/prisma";
import { listAgents } from "@/lib/ai/registry";
import { listPrompts } from "@/lib/ai/prompts/registry";
import { listTools } from "@/lib/ai/tools/registry";
import { AI_MODEL_REGISTRY } from "@/lib/ai/models/registry";
import type { AiModelProvider, AiProviderDefinition } from "@/lib/ai/types";
import { isAIProviderConfigured } from "@/lib/ai/provider";

const PROVIDER_DEFS: AiProviderDefinition[] = [
  { code: "openai", name: "OpenAI", status: "INACTIVE", isConfigured: false },
  { code: "anthropic", name: "Anthropic (Claude)", status: "INACTIVE", isConfigured: false },
  { code: "google", name: "Google (Gemini)", status: "INACTIVE", isConfigured: false },
];

export async function bootstrapAiPlatform() {
  if (isAIProviderConfigured()) return;

  for (const p of PROVIDER_DEFS) {
    await prisma.aIProvider.upsert({
      where: { code: p.code },
      create: { code: p.code, name: p.name, status: "INACTIVE", isConfigured: false },
      update: { name: p.name },
    });
  }

  for (const model of Object.values(AI_MODEL_REGISTRY)) {
    const provider = await prisma.aIProvider.findUnique({ where: { code: model.provider } });
    if (!provider) continue;
    await prisma.aIModel.upsert({
      where: { providerId_code: { providerId: provider.id, code: model.id } },
      create: {
        providerId: provider.id,
        code: model.id,
        name: model.label,
        version: model.version,
        contextWindow: model.contextWindow,
        streaming: model.streaming,
        vision: model.vision,
        functionCalling: model.functionCalling,
        status: "INACTIVE",
        inputCostPer1k: model.inputCostPer1kUsd,
        outputCostPer1k: model.outputCostPer1kUsd,
      },
      update: {
        name: model.label,
        version: model.version,
        contextWindow: model.contextWindow,
      },
    });
  }

  for (const agent of listAgents()) {
    await prisma.aIAgent.upsert({
      where: { code: agent.id },
      create: {
        code: agent.id,
        name: agent.name,
        description: agent.description,
        temperature: agent.temperature,
        toolIds: agent.toolIds,
        permissions: agent.allowedRoles,
        status: agent.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
      },
      update: {
        name: agent.name,
        description: agent.description,
        temperature: agent.temperature,
      },
    });
  }

  for (const prompt of listPrompts()) {
    const existing = await prisma.aIPrompt.findFirst({
      where: { code: prompt.key, version: prompt.version },
    });
    if (!existing) {
      await prisma.aIPrompt.create({
        data: {
          code: prompt.key,
          name: prompt.name,
          category: prompt.category,
          version: prompt.version,
          content: prompt.content,
          recommendedModel: prompt.recommendedModel,
          temperature: prompt.temperature,
          isActive: prompt.isActive,
        },
      });
    }
  }

  for (const t of listTools()) {
    await prisma.aITool.upsert({
      where: { code: t.id },
      create: {
        code: t.id,
        name: t.name,
        description: t.description,
        permissions: t.requiredRoles,
        parameters: t.parameters,
        status: t.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
      },
      update: { name: t.name, description: t.description },
    });
  }
}

export async function listDbProviders() {
  await bootstrapAiPlatform();
  return prisma.aIProvider.findMany({ include: { _count: { select: { models: true } } } });
}

export async function listDbModels() {
  await bootstrapAiPlatform();
  return prisma.aIModel.findMany({ include: { provider: true } });
}

export async function listDbAgents() {
  await bootstrapAiPlatform();
  return prisma.aIAgent.findMany({ include: { model: true, prompt: true } });
}

export async function listDbPrompts() {
  await bootstrapAiPlatform();
  return prisma.aIPrompt.findMany({ orderBy: [{ code: "asc" }, { version: "desc" }] });
}

export async function listDbTools() {
  await bootstrapAiPlatform();
  return prisma.aITool.findMany();
}

export function listCodeProviders(): AiProviderDefinition[] {
  return PROVIDER_DEFS.map((p) => ({
    ...p,
    isConfigured: isAIProviderConfigured() && p.code === "openai",
  }));
}

export function getProviderByCode(code: AiModelProvider) {
  return PROVIDER_DEFS.find((p) => p.code === code) ?? null;
}
