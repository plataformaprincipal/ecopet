import { runAdminSmokeTest } from "@/lib/integrations/run-admin-smoke-test";
import { smokeTestTwilio } from "@/lib/integrations/integration-smoke-tests";

/** POST /api/admin/integrations/twilio/test */
export async function POST() {
  return runAdminSmokeTest("/api/admin/integrations/twilio/test", (actorId) =>
    smokeTestTwilio(actorId)
  );
}
