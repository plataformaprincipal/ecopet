import { runAdminSmokeTest } from "@/lib/integrations/run-admin-smoke-test";
import { smokeTestCloudinary } from "@/lib/integrations/integration-smoke-tests";

/** POST /api/admin/integrations/cloudinary/test */
export async function POST() {
  return runAdminSmokeTest("/api/admin/integrations/cloudinary/test", (actorId) =>
    smokeTestCloudinary(actorId)
  );
}
