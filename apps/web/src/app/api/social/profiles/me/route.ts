import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { getPublicProfile, updateMyProfile } from "@/lib/social/profiles";

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const profile = await getPublicProfile(user!.id, user!.id);
    return apiSuccess({ profile });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const body = await req.json();
    const profile = await updateMyProfile(user!.id, body);
    return apiSuccess({ profile });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
