-- AlterTable ChildProfile
CREATE INDEX "parental_child_profiles_parentId_createdAt_idx" ON "parental_child_profiles"("parentId", "createdAt");

-- AlterTable ParentalApproval
CREATE INDEX "parental_approvals_childId_at_idx" ON "parental_approvals"("childId", "at");

-- AlterTable ParentalActivity
CREATE INDEX "parental_activities_childId_at_idx" ON "parental_activities"("childId", "at");

-- AlterTable Session
CREATE INDEX "sessions_userId_lastUsedAt_idx" ON "sessions"("userId", "lastUsedAt");

-- AlterTable SecurityReport
CREATE INDEX "security_reports_userId_createdAt_idx" ON "security_reports"("userId", "createdAt");

-- AlterTable SupportTicket
CREATE INDEX "support_tickets_userId_createdAt_idx" ON "support_tickets"("userId", "createdAt");
