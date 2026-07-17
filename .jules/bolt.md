## 2024-07-17 - [Add composite indexes for parental models]
**Learning:** The `findManyByChildId` access patterns on `ParentalApproval` and `ParentalActivity` models filter by `childId` and sort by `at`. The `ChildProfile` model relies on a composite index `@@index([parentId, createdAt])` to efficiently support its `findManyByParentId` query. Without these composite indexes, queries rely on expensive in-memory filesorts.
**Action:** Add `@@index([childId, at])` to `ParentalApproval` and `ParentalActivity`, and `@@index([parentId, createdAt])` to `ChildProfile` in `prisma/schema.prisma`.
