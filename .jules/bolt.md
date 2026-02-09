## 2026-02-09 - Missing Foreign Key Indexes
**Learning:** Prisma does not automatically index foreign key columns in relations. This leads to sequential scans on lookups like `Notification.userId` or `ChildProfile.parentId`, which are high-volume queries.
**Action:** Always manually add `@@index([foreignKey])` to the `schema.prisma` definition for relations that will be queried frequently.
