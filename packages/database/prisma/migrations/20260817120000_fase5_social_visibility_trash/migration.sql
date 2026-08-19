-- Fase 5: hideLikeCount, lixeira/auditoria e sinais de feed (ocultar / não tenho interesse)

ALTER TABLE "SocialPost" ADD COLUMN IF NOT EXISTS "hideLikeCount" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "SocialReport" ADD COLUMN IF NOT EXISTS "targetSnapshot" JSONB;

DO $$ BEGIN
 CREATE TYPE "SocialFeedSignalKind" AS ENUM ('HIDE', 'NOT_INTERESTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "SocialHiddenPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "kind" "SocialFeedSignalKind" NOT NULL DEFAULT 'HIDE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialHiddenPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SocialHiddenPost_userId_postId_key" ON "SocialHiddenPost"("userId", "postId");
CREATE INDEX IF NOT EXISTS "SocialHiddenPost_userId_idx" ON "SocialHiddenPost"("userId");
CREATE INDEX IF NOT EXISTS "SocialHiddenPost_postId_idx" ON "SocialHiddenPost"("postId");

DO $$ BEGIN
 ALTER TABLE "SocialHiddenPost" ADD CONSTRAINT "SocialHiddenPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
 ALTER TABLE "SocialHiddenPost" ADD CONSTRAINT "SocialHiddenPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
