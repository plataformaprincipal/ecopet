import { NextResponse } from "next/server";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push/vapid";

/** Public VAPID key for browser PushManager.subscribe — never returns private key. */
export async function GET() {
  if (!isPushConfigured()) {
    return NextResponse.json({ configured: false });
  }
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json({ configured: false });
  }
  return NextResponse.json({ configured: true, publicKey });
}
