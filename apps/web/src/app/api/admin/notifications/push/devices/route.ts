import { UserRole } from "@prisma/client";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Lista dispositivos push — sem token, sem encryptedToken. */
export async function GET(req: Request) {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  if (!checkRateLimit(`admin-fcm-devices:${user!.id}`, 30, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite excedido.", 429);
  }

  const url = new URL(req.url);
  const activeOnly = url.searchParams.get("active") !== "false";

  const devices = await prisma.pushDevice.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { lastSeenAt: "desc" },
    take: 100,
    select: {
      id: true,
      userId: true,
      provider: true,
      platform: true,
      browser: true,
      deviceName: true,
      permissionStatus: true,
      active: true,
      lastSeenAt: true,
      lastSentAt: true,
      lastSuccessAt: true,
      lastFailureAt: true,
      failureCount: true,
      invalidatedAt: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return apiSuccess({
    devices: devices.map((d) => ({
      id: d.id,
      userId: d.userId,
      userName: d.user.name,
      userEmail: d.user.email.replace(/(.{2}).+(@.+)/, "$1***$2"),
      role: d.user.role,
      provider: d.provider,
      platform: d.platform,
      browser: d.browser,
      deviceName: d.deviceName,
      permissionStatus: d.permissionStatus,
      active: d.active,
      lastSeenAt: d.lastSeenAt,
      lastSentAt: d.lastSentAt,
      lastSuccessAt: d.lastSuccessAt,
      lastFailureAt: d.lastFailureAt,
      failureCount: d.failureCount,
      invalidatedAt: d.invalidatedAt,
      createdAt: d.createdAt,
    })),
  });
}
