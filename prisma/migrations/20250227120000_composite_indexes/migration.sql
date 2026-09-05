-- CreateIndex
CREATE INDEX "parental_activities_childId_at_idx" ON "parental_activities"("childId", "at" DESC);

-- CreateIndex
CREATE INDEX "parental_approvals_childId_at_idx" ON "parental_approvals"("childId", "at" DESC);

-- CreateIndex
CREATE INDEX "parental_child_profiles_parentId_createdAt_idx" ON "parental_child_profiles"("parentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "sessions_userId_lastUsedAt_idx" ON "sessions"("userId", "lastUsedAt" DESC);

-- CreateIndex
CREATE INDEX "security_reports_userId_createdAt_idx" ON "security_reports"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "support_tickets_userId_createdAt_idx" ON "support_tickets"("userId", "createdAt" DESC);
