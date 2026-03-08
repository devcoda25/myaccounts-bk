## 2024-05-15 - Missing composite indexes in Prisma models
**Learning:** Common queries filter by a user/child ID and sort by a timestamp. While the ID is often indexed by itself, or implicitly via foreign key, composite indexes (`@@index([userId, createdAt])`) are required for optimal performance on Postgres, otherwise the DB might do an in-memory sort or full scan.
**Action:** When inspecting access patterns and Prisma schema, always check for `orderBy` in `findMany` queries, and add corresponding `@@index([foreignKey, orderColumn])`.
