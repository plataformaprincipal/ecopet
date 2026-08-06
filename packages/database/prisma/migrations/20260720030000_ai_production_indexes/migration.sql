-- Índices de performance / ops para camada AI (produção)

CREATE INDEX IF NOT EXISTS "AIMessage_conversationId_createdAt_idx"
  ON "AIMessage"("conversationId", "createdAt");

CREATE INDEX IF NOT EXISTS "AITokenUsage_createdAt_idx"
  ON "AITokenUsage"("createdAt");

CREATE INDEX IF NOT EXISTS "AITokenUsage_usageDate_userId_idx"
  ON "AITokenUsage"("usageDate", "userId");

CREATE INDEX IF NOT EXISTS "AIFeedback_createdAt_idx"
  ON "AIFeedback"("createdAt");

CREATE INDEX IF NOT EXISTS "AIFeedback_conversationId_idx"
  ON "AIFeedback"("conversationId");

CREATE INDEX IF NOT EXISTS "AIAuditLog_createdAt_idx"
  ON "AIAuditLog"("createdAt");
