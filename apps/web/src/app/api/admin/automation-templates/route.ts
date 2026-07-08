import { requireAdmin } from "@/lib/auth/guards";
import { handleGestorRouteError } from "@/lib/gestor/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { seedAutomationTemplates } from "@/lib/platform/integration-automation-service";

export async function GET() {
  const { error } = await requireAdmin({ path: "/api/admin/automation-templates" });
  if (error) return error;
  try {
    await seedAutomationTemplates();
    const items = await prisma.automationTemplate.findMany({ orderBy: { name: "asc" } });
    return apiSuccess({ items });
  } catch (e) {
    return handleGestorRouteError(e);
  }
}

export async function POST() {
  const { error } = await requireAdmin({ path: "/api/admin/automation-templates" });
  if (error) return error;
  try {
    await seedAutomationTemplates();
    const count = await prisma.automationTemplate.count();
    return apiSuccess({ seeded: count });
  } catch (e) {
    return handleGestorRouteError(e);
  }
}
