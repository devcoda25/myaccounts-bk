## 2025-01-26 - [Prisma Indexing Defaults]
**Learning:** Prisma does not automatically index foreign keys (e.g., `userId` in `Notification`), leading to full table scans on relational queries.
**Action:** Manually audit `schema.prisma` for missing `@@index` on all foreign key columns involved in filtering.
