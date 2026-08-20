import "server-only";

import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encryptMpSecret } from "@/lib/mercado-pago/mp-secret-crypto";
import { writeAuditLog } from "@/lib/audit-log";

export type PartnerMpConnectionStatus =
  | "NOT_CONNECTED"
  | "PENDING"
  | "CONNECTED"
  | "ERROR"
  | "REAUTH_REQUIRED";

export type PartnerMpConnectionView = {
  status: PartnerMpConnectionStatus;
  mpUserId: string | null;
  connectedAt: string | null;
  expiresAt: string | null;
  lastError: string | null;
  oauthConfigured: boolean;
  /** Nunca tokens. */
};

function oauthConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(source.MERCADO_PAGO_CLIENT_ID?.trim() && source.MERCADO_PAGO_CLIENT_SECRET?.trim());
}

function publicAppUrl(source: NodeJS.ProcessEnv = process.env): string {
  return (
    source.NEXT_PUBLIC_APP_URL?.trim() ||
    source.APP_URL?.trim() ||
    source.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function getPartnerMpConnectionView(partnerId: string): Promise<PartnerMpConnectionView> {
  const configured = oauthConfigured();
  const disconnected = (lastError: string | null): PartnerMpConnectionView => ({
    status: "NOT_CONNECTED",
    mpUserId: null,
    connectedAt: null,
    expiresAt: null,
    lastError,
    oauthConfigured: configured,
  });
  let row;
  try {
    row = await prisma.partnerMpConnection.findUnique({ where: { partnerId } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021") {
      return disconnected("Tabela PartnerMpConnection ainda não migrada neste banco.");
    }
    throw e;
  }
  if (!row) {
    return disconnected(configured ? null : "OAuth Mercado Pago do vendedor não configurado (CLIENT_ID/SECRET).");
  }
  let status = row.status as PartnerMpConnectionStatus;
  if (status === "CONNECTED" && row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    status = "REAUTH_REQUIRED";
  }
  return {
    status,
    mpUserId: row.mpUserId,
    connectedAt: row.connectedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    lastError: row.lastError,
    oauthConfigured: configured,
  };
}

export async function startPartnerMpOAuth(partnerId: string): Promise<
  { ok: true; url: string } | { ok: false; code: string; message: string }
> {
  if (!oauthConfigured()) {
    return {
      ok: false,
      code: "OAUTH_NOT_CONFIGURED",
      message:
        "OAuth do vendedor exige MERCADO_PAGO_CLIENT_ID e MERCADO_PAGO_CLIENT_SECRET no servidor (app Mercado Pago marketplace). Não cole access token na UI.",
    };
  }
  const state = randomBytes(24).toString("hex");
  await prisma.partnerMpConnection.upsert({
    where: { partnerId },
    create: { partnerId, status: "PENDING", oauthState: state, lastError: null },
    update: { status: "PENDING", oauthState: state, lastError: null, revokedAt: null },
  });
  const redirectUri = `${publicAppUrl()}/api/partner/financeiro/mp-connection/callback`;
  const url = new URL("https://auth.mercadopago.com.br/authorization");
  url.searchParams.set("client_id", process.env.MERCADO_PAGO_CLIENT_ID!.trim());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", redirectUri);
  return { ok: true, url: url.toString() };
}

export async function completePartnerMpOAuth(params: {
  code: string;
  state: string;
}): Promise<{ ok: true; partnerId: string } | { ok: false; code: string; message: string }> {
  if (!oauthConfigured()) {
    return { ok: false, code: "OAUTH_NOT_CONFIGURED", message: "OAuth não configurado." };
  }
  const row = await prisma.partnerMpConnection.findFirst({
    where: { oauthState: params.state, status: "PENDING" },
  });
  if (!row) {
    return { ok: false, code: "INVALID_STATE", message: "State OAuth inválido ou expirado." };
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.MERCADO_PAGO_CLIENT_ID!.trim(),
    client_secret: process.env.MERCADO_PAGO_CLIENT_SECRET!.trim(),
    code: params.code,
    redirect_uri: `${publicAppUrl()}/api/partner/financeiro/mp-connection/callback`,
  });

  const res = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    user_id?: number | string;
    expires_in?: number;
    error?: string;
    message?: string;
  };

  if (!res.ok || !json.access_token) {
    await prisma.partnerMpConnection.update({
      where: { id: row.id },
      data: {
        status: "ERROR",
        lastError: String(json.error || json.message || `HTTP ${res.status}`).slice(0, 240),
        oauthState: null,
      },
    });
    return { ok: false, code: "TOKEN_EXCHANGE_FAILED", message: "Falha ao autorizar Mercado Pago." };
  }

  const expiresAt =
    typeof json.expires_in === "number" ? new Date(Date.now() + json.expires_in * 1000) : null;

  await prisma.partnerMpConnection.update({
    where: { id: row.id },
    data: {
      status: "CONNECTED",
      mpUserId: json.user_id != null ? String(json.user_id) : null,
      accessTokenEnc: encryptMpSecret(json.access_token),
      refreshTokenEnc: json.refresh_token ? encryptMpSecret(json.refresh_token) : null,
      oauthState: null,
      lastError: null,
      connectedAt: new Date(),
      expiresAt,
    },
  });

  await writeAuditLog({
    actorId: row.partnerId,
    action: "UPDATE",
    module: "finance",
    resource: "PartnerMpConnection",
    resourceId: row.id,
    observation: "partner.mp.oauth.connected",
    entityAfter: { mpUserId: json.user_id != null ? String(json.user_id) : null, status: "CONNECTED" },
  }).catch(() => undefined);

  return { ok: true, partnerId: row.partnerId };
}
