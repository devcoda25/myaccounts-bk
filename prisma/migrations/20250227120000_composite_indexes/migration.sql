CREATE INDEX "parental_child_profiles_parentId_createdAt_idx" ON "parental_child_profiles"("parentId", "createdAt");
CREATE INDEX "parental_approvals_childId_at_idx" ON "parental_approvals"("childId", "at");
CREATE INDEX "parental_activities_childId_at_idx" ON "parental_activities"("childId", "at");