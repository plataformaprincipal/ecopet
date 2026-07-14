import { runAdminSmokeTest } from "@/lib/integrations/run-admin-smoke-test";
import { smokeTestTalkjs } from "@/lib/integrations/integration-smoke-tests";

/** POST /api/admin/integrations/talkjs/test */
export async function POST() {
  return runAdminSmokeTest("/api/admin/integrations/talkjs/test", (actorId) =>
    smokeTestTalkjs(actorId)
  );
}
