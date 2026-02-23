## 2025-02-19 - [Missing Foreign Key Indexes in Prisma]
**Learning:** Prisma does not automatically add indexes for foreign keys in PostgreSQL. The `Notification` model was missing an index on `userId`, causing potential full table scans for user notification feeds.
**Action:** Always manually check and add `@@index` for foreign keys and common query patterns (like `orderBy: { createdAt: 'desc' }`) in `schema.prisma`.
