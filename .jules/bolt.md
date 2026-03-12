## 2025-02-19 - Composite Indexes for Filter/Sort Patterns
**Learning:** In this Prisma/Postgres stack, common access patterns often filter by an ID (e.g., `userId`, `childId`, `parentId`) and order by a timestamp (`createdAt`, `at`, `lastUsedAt`). Missing composite indexes on these combinations lead to expensive in-memory sorts for large datasets.
**Action:** When adding models that query by a foreign key and sort chronologically, always preemptively add a composite index like `@@index([userId, createdAt])` in `schema.prisma`.
