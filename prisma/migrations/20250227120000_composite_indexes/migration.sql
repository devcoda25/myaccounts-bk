CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt" DESC);
CREATE INDEX "security_reports_userId_createdAt_idx" ON "security_reports"("userId", "createdAt" DESC);
CREATE INDEX "support_tickets_userId_createdAt_idx" ON "support_tickets"("userId", "createdAt" DESC);
