-- CreateIndex
CREATE INDEX "parental_child_profiles_parentId_createdAt_idx" ON "parental_child_profiles"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "parental_approvals_childId_at_idx" ON "parental_approvals"("childId", "at");

-- CreateIndex
CREATE INDEX "parental_activities_childId_at_idx" ON "parental_activities"("childId", "at");

-- CreateIndex
CREATE INDEX "security_reports_userId_createdAt_idx" ON "security_reports"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "support_tickets_userId_createdAt_idx" ON "support_tickets"("userId", "createdAt");
