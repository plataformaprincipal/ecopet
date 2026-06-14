import { NextResponse } from "next/server";
import { getCurrentUser, sanitizeUser } from "@/lib/auth";
import { apiError } from "@/lib/api-response";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", 401);
  }
  return NextResponse.json({ user: sanitizeUser(user) });
}