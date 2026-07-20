import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { getEnterpriseDiagnostics } from "@/lib/ai/enterprise";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error } = await requireAdmin({
    path: new URL(request.url).pathname,
  });
  if (error) return error;

  const data = await getEnterpriseDiagnostics();
  return apiSuccess(data);
}
