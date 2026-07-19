import "server-only";

import { prisma } from "@/lib/prisma";
import { decryptFcmToken, encryptFcmToken, hashFcmToken } from "./token-crypto";

const MAX_UA = 240;

export function sanitizeUserAgent(ua: string | null | undefined): string | null {
  if (!ua) return null;
  return ua
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_UA);
}

export function detectPlatformBrowser(ua: string | null): {
  platform: string;
  browser: string;
} {
  const s = (ua || "").toLowerCase();
  let platform = "web";
  if (s.includes("android")) platform = "android";
  else if (s.includes("iphone") || s.includes("ipad") || s.includes("ios")) platform = "ios";
  else if (s.includes("windows")) platform = "windows";
  else if (s.includes("mac os") || s.includes("macintosh")) platform = "macos";
  else if (s.includes("linux")) platform = "linux";

  let browser = "unknown";
  if (s.includes("edg/")) browser = "edge";
  else if (s.includes("chrome/") && !s.includes("edg/")) browser = "chrome";
  else if (s.includes("firefox/")) browser = "firefox";
  else if (s.includes("safari/") && !s.includes("chrome/")) browser = "safari";

  return { platform, browser };
}

export type RegisterPushDeviceInput = {
  userId: string;
  token: string;
  deviceId?: string | null;
  deviceName?: string | null;
  userAgent?: string | null;
  permissionStatus?: string;
};

/**
 * Upsert seguro do dispositivo FCM.
 * - userId sempre da sessão (nunca confiar no body).
 * - reassocia token se já existia para outro usuário (token mudou de conta no mesmo browser).
 */
export async function registerPushDevice(input: RegisterPushDeviceInput) {
  const token = input.token.trim();
  if (token.length < 20 || token.length > 4096) {
    throw new Error("INVALID_TOKEN_LENGTH");
  }

  const tokenHash = hashFcmToken(token);
  const encryptedToken = encryptFcmToken(token);
  const userAgentSanitized = sanitizeUserAgent(input.userAgent);
  const { platform, browser } = detectPlatformBrowser(userAgentSanitized);
  const now = new Date();

  const existing = await prisma.pushDevice.findUnique({ where: { tokenHash } });

  if (existing) {
    return prisma.pushDevice.update({
      where: { id: existing.id },
      data: {
        userId: input.userId,
        encryptedToken,
        deviceId: input.deviceId?.slice(0, 120) || existing.deviceId,
        deviceName: input.deviceName?.slice(0, 120) || existing.deviceName,
        platform,
        browser,
        userAgentSanitized,
        permissionStatus: input.permissionStatus || "GRANTED",
        active: true,
        lastSeenAt: now,
        invalidatedAt: null,
        failureCount: 0,
      },
      select: {
        id: true,
        deviceId: true,
        platform: true,
        browser: true,
        active: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
  }

  return prisma.pushDevice.create({
    data: {
      userId: input.userId,
      provider: "FCM",
      tokenHash,
      encryptedToken,
      deviceId: input.deviceId?.slice(0, 120) || null,
      deviceName: input.deviceName?.slice(0, 120) || null,
      platform,
      browser,
      userAgentSanitized,
      permissionStatus: input.permissionStatus || "GRANTED",
      active: true,
      lastSeenAt: now,
    },
    select: {
      id: true,
      deviceId: true,
      platform: true,
      browser: true,
      active: true,
      lastSeenAt: true,
      createdAt: true,
    },
  });
}

export async function unregisterPushDevice(params: {
  userId: string;
  deviceId?: string | null;
  token?: string | null;
}): Promise<{ deactivated: number }> {
  if (params.token) {
    const tokenHash = hashFcmToken(params.token.trim());
    const result = await prisma.pushDevice.updateMany({
      where: { userId: params.userId, tokenHash, active: true },
      data: { active: false, invalidatedAt: new Date() },
    });
    return { deactivated: result.count };
  }

  if (params.deviceId) {
    const result = await prisma.pushDevice.updateMany({
      where: { userId: params.userId, deviceId: params.deviceId, active: true },
      data: { active: false, invalidatedAt: new Date() },
    });
    return { deactivated: result.count };
  }

  return { deactivated: 0 };
}

/** Logout: desativa apenas o dispositivo atual (por deviceId). */
export async function deactivateCurrentDevice(
  userId: string,
  deviceId: string | null | undefined
): Promise<void> {
  if (!deviceId) return;
  try {
    await prisma.pushDevice.updateMany({
      where: { userId, deviceId, active: true },
      data: { active: false },
    });
  } catch {
    /* não quebrar logout */
  }
}

export async function invalidatePushDevice(deviceId: string, errorCode?: string): Promise<void> {
  await prisma.pushDevice.update({
    where: { id: deviceId },
    data: {
      active: false,
      invalidatedAt: new Date(),
      lastFailureAt: new Date(),
      failureCount: { increment: 1 },
    },
  });
  void errorCode;
}

export async function listActivePushDevices(userId: string) {
  return prisma.pushDevice.findMany({
    where: { userId, active: true, provider: "FCM", invalidatedAt: null },
    orderBy: { lastSeenAt: "desc" },
  });
}

export function revealDeviceToken(encryptedToken: string): string {
  return decryptFcmToken(encryptedToken);
}

export async function getPushStatusForUser(userId: string, deviceId?: string | null) {
  const [activeDeviceCount, thisDevice] = await Promise.all([
    prisma.pushDevice.count({ where: { userId, active: true } }),
    deviceId
      ? prisma.pushDevice.findFirst({
          where: { userId, deviceId, active: true },
          select: { id: true, lastSeenAt: true, platform: true, browser: true },
        })
      : Promise.resolve(null),
  ]);

  return {
    activeDeviceCount,
    activeOnThisDevice: Boolean(thisDevice),
    lastSyncedAt: thisDevice?.lastSeenAt?.toISOString() ?? null,
    platform: thisDevice?.platform ?? null,
    browser: thisDevice?.browser ?? null,
  };
}

/** Exclusão de conta / LGPD — desativa todos os dispositivos. */
export async function deactivateAllDevicesForUser(userId: string): Promise<number> {
  const result = await prisma.pushDevice.updateMany({
    where: { userId, active: true },
    data: { active: false, invalidatedAt: new Date() },
  });
  return result.count;
}
