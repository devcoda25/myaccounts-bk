## 2026-06-26 - [Database Index Optimization]
**Learning:** The models `ParentalActivity` and `ParentalApproval` are frequently queried by `childId` and sorted by `at`, and `ChildProfile` is queried by `parentId` and sorted by `createdAt` (e.g. `findManyByChildId` and `findManyByParentId`). These queries can cause expensive in-memory sorts.
**Action:** Add composite indexes `@@index([childId, at])` to `ParentalActivity` and `ParentalApproval`, and `@@index([parentId, createdAt])` to `ChildProfile` in `prisma/schema.prisma` to optimize these `findMany` queries and avoid in-memory sorting.
