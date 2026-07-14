import { runAdminSmokeTest } from "@/lib/integrations/run-admin-smoke-test";
import { smokeTestResend } from "@/lib/integrations/integration-smoke-tests";

/** POST /api/admin/integrations/resend/test */
export async function POST() {
  return runAdminSmokeTest("/api/admin/integrations/resend/test", (actorId) =>
    smokeTestResend(actorId)
  );
}
