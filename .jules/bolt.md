## 2025-02-27 - Missing Foreign Key Indexes in Prisma
**Learning:** In Prisma with PostgreSQL, foreign keys (`@relation`) do not automatically create database indexes. This causes silent performance bottlenecks (e.g. full table scans) on frequently queried relation fields like `parentId` in `ChildProfile`.
**Action:** Always manually define `@@index([foreignKeyId])` in `schema.prisma` for relation fields that are frequently queried or used in `include` statements.
