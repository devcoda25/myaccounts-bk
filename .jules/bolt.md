## 2026-11-03 - [Database Optimizations]
**Learning:** Postgres does not automatically index foreign keys, leading to potential full table scans on queries that fetch dependent records (like `ChildProfile` by `parentId`).
**Action:** Always add explicit indexes on foreign keys in Prisma using `@@index([foreignKeyField])` for relationships that will be frequently queried.
