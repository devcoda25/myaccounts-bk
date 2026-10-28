## 2024-10-28 - [Database Indexing]
**Learning:** PostgreSQL does not automatically index foreign keys like `parentId`, `ownerId`, `householdId`, and `childId` in Prisma schemas, leading to full table scans.
**Action:** Manually add `@@index` directives for foreign keys to prevent full table scans and improve query performance for relation lookups.