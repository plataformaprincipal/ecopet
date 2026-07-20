import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { createConversation } from "@/lib/ai/memory/store";
import { normalizeLocale } from "@/lib/ai/ai-config";
import { listAssistantConversations } from "@/lib/ai/assistant";

export async function GET(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const q = new URL(request.url).searchParams.get("q") ?? undefined;
  const conversations = await listAssistantConversations(user.id, q ?? undefined);
  return apiSuccess({ conversations });
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const body = await request.json().catch(() => ({}));
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 120)
      : undefined;
  const locale = normalizeLocale(
    typeof body.locale === "string" ? body.locale : undefined
  );

  try {
    const conversation = await createConversation({
      userId: user.id,
      module: "ecopet-ai",
      role: String(user.role),
      locale,
      title,
      agentCode: "client",
    });
    return apiSuccess({ conversation }, 201);
  } catch {
    return apiFailure("INTERNAL", "Não foi possível criar a conversa.", 500);
  }
}
