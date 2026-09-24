-- CreateIndex
CREATE INDEX "support_tickets_userId_createdAt_idx" ON "support_tickets"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "security_reports_userId_createdAt_idx" ON "security_reports"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "sessions_userId_lastUsedAt_idx" ON "sessions"("userId", "lastUsedAt" DESC);