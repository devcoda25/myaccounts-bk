## 2025-01-26 - [Missing FK Indexes in Prisma]
**Learning:** Prisma does not automatically index foreign keys in PostgreSQL. This causes performance issues in `findMany` queries filtering by FK (e.g., `NotificationsService.findAll` by `userId`).
**Action:** Always manually add `@@index([foreignKey])` or composite indexes like `@@index([foreignKey, sortField])` in `schema.prisma` for frequently queried relations.
