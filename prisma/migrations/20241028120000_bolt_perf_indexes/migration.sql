-- CreateIndex
CREATE INDEX "parental_child_profiles_parentId_idx" ON "parental_child_profiles"("parentId");

-- CreateIndex
CREATE INDEX "parental_households_ownerId_idx" ON "parental_households"("ownerId");

-- CreateIndex
CREATE INDEX "parental_household_members_householdId_idx" ON "parental_household_members"("householdId");

-- CreateIndex
CREATE INDEX "parental_approvals_childId_idx" ON "parental_approvals"("childId");

-- CreateIndex
CREATE INDEX "parental_activities_childId_idx" ON "parental_activities"("childId");
