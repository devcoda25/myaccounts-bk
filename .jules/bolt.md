## 2024-10-30 - Missing Index on Foreign Keys
**Learning:** PostgreSQL (used here with Prisma) does not automatically index foreign key columns (unlike MySQL). Foreign keys like `parentId` on `ChildProfile` and `childId` on `ParentalApproval`/`ParentalActivity`/`HouseholdMember` are frequently queried to retrieve related records, yet they are lacking indexes in this Prisma schema, which can lead to sequential table scans and O(N) performance degradation as tables grow.
**Action:** Always manually verify and add `@@index` for foreign key relations in Prisma schemas targeting PostgreSQL.
