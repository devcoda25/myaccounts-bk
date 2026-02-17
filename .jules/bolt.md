## 2026-02-17 - [Missing FK Indexes in Prisma]
**Learning:** Prisma does not automatically index foreign keys for PostgreSQL. This led to O(N) performance for notification queries.
**Action:** Always verify `@@index([foreignKey])` exists for high-volume relationships, and consider `@@index([foreignKey, sortKey])` for lists.
