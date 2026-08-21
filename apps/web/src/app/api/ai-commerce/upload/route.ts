import { requireAuth } from "@/lib/auth/require-auth";
import { storeExecutionAsset } from "@/lib/ai-commerce/upload";
import { enforceAiCommerceEndpointLimits, handleAiCommerceError } from "@/lib/ai-commerce/http";
import { apiFailure, apiSuccess } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const limited = await enforceAiCommerceEndpointLimits({
    request,
    userId: user!.id,
    endpoint: "upload",
  });
  if (limited) return limited;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const executionId = String(form.get("executionId") ?? "");
    const petId = String(form.get("petId") ?? "");
    const type = String(form.get("type") ?? "") as "vision" | "lab";
    if (!(file instanceof File) || !executionId || !petId || (type !== "vision" && type !== "lab")) {
      return apiFailure("VALIDATION", "Arquivo inválido.", 400);
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const asset = await storeExecutionAsset({
      userId: user!.id,
      executionId,
      petId,
      type,
      mimeType: file.type,
      buffer: buf,
      fileName: file.name,
    });
    return apiSuccess({ id: asset.id, status: asset.status });
  } catch (e) {
    return handleAiCommerceError(e);
  }
}
