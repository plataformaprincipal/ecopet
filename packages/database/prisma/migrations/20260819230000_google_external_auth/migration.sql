-- Google OAuth identity. passwordHash opcional para contas só-Google.
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "ExternalAuthAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ExternalAuthAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExternalAuthAccount_provider_providerAccountId_key"
  ON "ExternalAuthAccount"("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "ExternalAuthAccount_userId_idx" ON "ExternalAuthAccount"("userId");
CREATE INDEX IF NOT EXISTS "ExternalAuthAccount_email_idx" ON "ExternalAuthAccount"("email");

ALTER TABLE "ExternalAuthAccount"
  ADD CONSTRAINT "ExternalAuthAccount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
