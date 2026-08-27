-- CreateIndex
CREATE INDEX "sessions_userId_lastUsedAt_idx" ON "sessions"("userId", "lastUsedAt" DESC);
