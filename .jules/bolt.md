## 2026-04-20 - Added missing database indexes
**Learning:** Prisma does not automatically index foreign key columns in PostgreSQL, requiring manual addition of `@@index` in `schema.prisma`. Missing indexes on foreign keys and sort columns cause expensive in-memory sorts.
**Action:** Added composite indexes like `@@index([userId, createdAt])` and `@@index([childId, at])` to optimize sorting on chronological query patterns.
