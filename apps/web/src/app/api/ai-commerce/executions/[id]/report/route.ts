import { requireAuth } from "@/lib/auth/require-auth";
import { getReportPdf } from "@/lib/ai-commerce/report-service";
import { enforceAiCommerceEndpointLimits, handleAiCommerceError } from "@/lib/ai-commerce/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await ctx.params;
  const limited = await enforceAiCommerceEndpointLimits({
    request: req,
    userId: user!.id,
    endpoint: "report",
    extraKey: id,
  });
  if (limited) return limited;
  try {
    const bytes = await getReportPdf({ userId: user!.id, executionId: id });
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-eccopet-${id}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (e) {
    return handleAiCommerceError(e);
  }
}
