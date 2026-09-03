import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { CatalogCommerceError } from "@/lib/commerce-catalog/checkout";
import { addCaseDocument } from "@/lib/commerce-catalog/health-cases";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await context.params;
  const form = await request.formData().catch(() => null);
  if (!form) return apiFailure("VALIDATION", "Envie o arquivo.", 400);
  const file = form.get("file");
  if (!(file instanceof File)) return apiFailure("VALIDATION", "Arquivo obrigatório.", 400);
  if (!ALLOWED.has(file.type)) return apiFailure("VALIDATION", "Envie PDF ou imagem.", 400);
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const doc = await addCaseDocument({
      caseId: id,
      userId: user!.id,
      title: String(form.get("title") || file.name).slice(0, 160),
      kind: String(form.get("kind") || "EXAME"),
      fileName: file.name,
      mimeType: file.type,
      buffer,
    });
    return apiSuccess({ document: doc });
  } catch (e) {
    if (e instanceof CatalogCommerceError) return apiFailure(e.code, e.message, e.status);
    return apiFailure("ERROR", "Falha no upload.", 500);
  }
}
