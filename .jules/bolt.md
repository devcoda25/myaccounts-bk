## 2024-04-27 - [Add composite indexes for parent/child queries]
**Learning:** Found missing composite index issue for nested child model ordering. `ChildProfile.findManyByParentId` includes `activities` ordered by `at`. Without `@@index([childId, at])` and `@@index([parentId, createdAt])`, Prisma forces the database to perform expensive filesorts on these frequent chronological queries.
**Action:** Always add composite indexes covering both the foreign key and the default sort column for frequently ordered relation fields in Prisma.
