CREATE INDEX "sessions_userId_lastUsedAt_idx" ON "sessions"("userId", "lastUsedAt" DESC);
CREATE INDEX "parental_child_profiles_parentId_createdAt_idx" ON "parental_child_profiles"("parentId", "createdAt" DESC);
CREATE INDEX "parental_approvals_childId_at_idx" ON "parental_approvals"("childId", "at" DESC);
CREATE INDEX "parental_activities_childId_at_idx" ON "parental_activities"("childId", "at" DESC);
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt" DESC);
CREATE INDEX "security_reports_userId_createdAt_idx" ON "security_reports"("userId", "createdAt" DESC);
CREATE INDEX "support_tickets_userId_createdAt_idx" ON "support_tickets"("userId", "createdAt" DESC);
