import { NextResponse } from "next/server";
import { completePartnerMpOAuth } from "@/lib/mercado-pago/partner-oauth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim();
  const state = url.searchParams.get("state")?.trim();
  if (!code || !state) {
    return NextResponse.redirect(new URL("/partner/financeiro?mp=invalid", url.origin));
  }
  const result = await completePartnerMpOAuth({ code, state });
  let dest = result.ok ? "/partner/financeiro?mp=connected" : "/partner/financeiro?mp=error";
  if (result.ok) {
    const user = await prisma.user.findUnique({
      where: { id: result.partnerId },
      select: { role: true },
    });
    if (user?.role === "ONG") {
      dest = result.ok ? "/ngo/financeiro?mp=connected" : "/ngo/financeiro?mp=error";
    }
  }
  return NextResponse.redirect(new URL(dest, url.origin));
}
