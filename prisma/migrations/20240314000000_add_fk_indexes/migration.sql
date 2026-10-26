-- CreateIndex
CREATE INDEX "parental_child_profiles_parentId_idx" ON "parental_child_profiles"("parentId");

-- CreateIndex
CREATE INDEX "parental_household_members_householdId_idx" ON "parental_household_members"("householdId");

-- CreateIndex
CREATE INDEX "parental_household_members_userId_idx" ON "parental_household_members"("userId");

-- CreateIndex
CREATE INDEX "parental_approvals_childId_idx" ON "parental_approvals"("childId");
