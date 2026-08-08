CREATE INDEX "parental_activities_childId_at_idx" ON "parental_activities"("childId", "at" DESC);
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt" DESC);
