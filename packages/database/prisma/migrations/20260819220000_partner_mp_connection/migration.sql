-- OAuth Mercado Pago do parceiro. Tokens cifrados; nunca retornados à UI.
CREATE TABLE IF NOT EXISTS "PartnerMpConnection" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
  "mpUserId" TEXT,
  "accessTokenEnc" TEXT,
  "refreshTokenEnc" TEXT,
  "oauthState" TEXT,
  "lastError" TEXT,
  "connectedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PartnerMpConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PartnerMpConnection_partnerId_key" ON "PartnerMpConnection"("partnerId");
CREATE INDEX IF NOT EXISTS "PartnerMpConnection_status_idx" ON "PartnerMpConnection"("status");
