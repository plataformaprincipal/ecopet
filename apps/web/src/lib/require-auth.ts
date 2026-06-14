import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { getCurrentUser, type SafeUser } from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import { assertRole, type AppRole } from "@/lib/permissions";

export async function requireAuth(): Promise<SafeUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", 401);
  }
  return user;
}

export async function requireRole(...roles: AppRole[]): Promise<SafeUser | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  if (!assertRole(result.role as AppRole, roles)) {
    return apiError("FORBIDDEN", 403);
  }
  return result;
}

export async function requireSelfOrAdmin(
  resourceUserId: string
): Promise<SafeUser | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  if (result.role === "ADMIN") return result;
  if (result.id !== resourceUserId) {
    return apiError("FORBIDDEN", 403);
  }
  return result;
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export type { UserRole };
