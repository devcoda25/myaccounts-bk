-- CreateIndex
CREATE INDEX "org_memberships_userId_idx" ON "org_memberships"("userId");

-- CreateIndex
CREATE INDEX "app_memberships_clientId_idx" ON "app_memberships"("clientId");

-- CreateIndex
CREATE INDEX "oauth_consents_clientId_idx" ON "oauth_consents"("clientId");

-- CreateIndex
CREATE INDEX "parental_child_profiles_parentId_idx" ON "parental_child_profiles"("parentId");

-- CreateIndex
CREATE INDEX "parental_household_members_householdId_idx" ON "parental_household_members"("householdId");

-- CreateIndex
CREATE INDEX "parental_household_members_userId_idx" ON "parental_household_members"("userId");

-- CreateIndex
CREATE INDEX "parental_approvals_childId_idx" ON "parental_approvals"("childId");

-- CreateIndex
CREATE INDEX "parental_activities_childId_idx" ON "parental_activities"("childId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
