CREATE INDEX "sessions_userId_expiresAt_idx" ON "sessions"("userId", "expiresAt" DESC);
CREATE INDEX "support_tickets_userId_createdAt_idx" ON "support_tickets"("userId", "createdAt" DESC);
CREATE INDEX "security_reports_userId_createdAt_idx" ON "security_reports"("userId", "createdAt" DESC);
CREATE INDEX "parental_activities_childId_at_idx" ON "parental_activities"("childId", "at" DESC);
CREATE INDEX "parental_approvals_childId_at_idx" ON "parental_approvals"("childId", "at" DESC);
