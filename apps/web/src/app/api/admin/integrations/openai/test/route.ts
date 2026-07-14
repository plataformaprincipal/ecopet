import { runAdminSmokeTest } from "@/lib/integrations/run-admin-smoke-test";
import { smokeTestOpenAi } from "@/lib/integrations/integration-smoke-tests";

/** POST /api/admin/integrations/openai/test */
export async function POST() {
  return runAdminSmokeTest("/api/admin/integrations/openai/test", (actorId) =>
    smokeTestOpenAi(actorId)
  );
}
