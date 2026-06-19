## 2024-06-19 - Missing Composite Indexes on Parental Models
**Learning:** `findManyByParentId` on `ChildProfile` includes `approvals` and `activities` sorted by `at: 'desc'`. Also `ChildProfile` is fetched ordered by `createdAt: 'desc'`. The DB needs composite indexes on `[parentId, createdAt]` for `ChildProfile`, and `[childId, at]` for `ParentalApproval` and `ParentalActivity` to avoid expensive in-memory sorts for these nested inclusions and direct queries.
**Action:** Add the corresponding composite indexes in `prisma/schema.prisma` with performance comments.
