import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { isFirebaseClientReady } from "@/lib/firebase/config";
import { getPushStatusForUser } from "@/lib/firebase/token-management";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const deviceId = url.searchParams.get("deviceId");

  const status = await getPushStatusForUser(user!.id, deviceId);

  return apiSuccess({
    configured: isFirebaseClientReady() && isFirebaseAdminConfigured(),
    clientReady: isFirebaseClientReady(),
    adminReady: isFirebaseAdminConfigured(),
    ...status,
  });
}
