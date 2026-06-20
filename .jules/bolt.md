## 2026-06-20 - [Added Performance Composite Indexes to Prisma Schema]
**Learning:** Models frequently queried by a specific ID (like userId, childId, or parentId) and sorted chronologically require composite indexes to optimize `findMany` queries and avoid expensive in-memory sorts.
**Action:** Add composite indexes like `@@index([childId, at])` or `@@index([userId, createdAt])` to these models in `prisma/schema.prisma` and verify validation with `npx prisma@6.2.1 format` and `validate`.
