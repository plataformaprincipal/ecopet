import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { ingestKnowledgeDocument } from "@/lib/ai/ai-embeddings";
import { writeAiAuditLog } from "@/lib/ai/ai-audit";

const schema = z.object({
  sourceType: z.string().optional(),
  force: z.boolean().optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireAdmin();
  if (error || !user) return error!;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", "Dados inválidos", 400);
  }

  const job = await prisma.aIJob.create({
    data: {
      userId: user.id,
      role: user.role,
      type: "REINDEX",
      status: "RUNNING",
      payload: { sourceType: parsed.data.sourceType ?? "all", force: parsed.data.force ?? false },
      startedAt: new Date(),
      attempts: 1,
    },
  });

  // Seed mínimo de conhecimento institucional (não inventa políticas — usa texto canônico)
  const docs = [
    {
      title: "Aviso de segurança EcoPet AI",
      sourceType: "policy",
      sourceId: "ai-safety-disclaimer",
      content:
        "A IA EcoPet não substitui médicos-veterinários, zootecnistas, adestradores, especialistas ou outros profissionais qualificados. As informações fornecidas possuem caráter informativo e de apoio à tomada de decisão.",
    },
    {
      title: "FAQ — Conta e login",
      sourceType: "faq",
      sourceId: "account-login",
      content:
        "Para acessar o EcoPet, use e-mail e senha cadastrados. Recuperação de senha está disponível em Esqueci minha senha. Nunca compartilhe códigos de verificação.",
    },
    {
      title: "FAQ — Marketplace",
      sourceType: "faq",
      sourceId: "marketplace",
      content:
        "Produtos e serviços listados no marketplace passam por aprovação. Preços e estoque são definidos pelos parceiros e refletidos em tempo real no banco de dados.",
    },
  ];

  let indexed = 0;
  const errors: string[] = [];
  for (const doc of docs) {
    try {
      if (parsed.data.sourceType && parsed.data.sourceType !== "all" && parsed.data.sourceType !== doc.sourceType) {
        continue;
      }
      await ingestKnowledgeDocument({ ...doc, locale: "pt-BR" });
      indexed += 1;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "erro");
    }
  }

  await prisma.aIJob.update({
    where: { id: job.id },
    data: {
      status: errors.length && indexed === 0 ? "FAILED" : "COMPLETED",
      result: { indexed, errors: errors.slice(0, 5) },
      finishedAt: new Date(),
      error: errors[0] ?? null,
    },
  });

  await writeAiAuditLog({
    userId: user.id,
    role: user.role,
    module: "admin",
    action: "reindex",
    decision: "EXECUTED",
    metadata: { indexed, jobId: job.id },
  });

  return apiSuccess({ jobId: job.id, indexed, errors: errors.slice(0, 5) });
}
