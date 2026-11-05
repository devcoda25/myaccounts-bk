## 2026-11-05 - [PostgreSQL Indexing for Prisma Models]
**Learning:** Prisma on PostgreSQL does not automatically index foreign keys or frequently queried lookup fields (e.g., `userCode`, `parentId`). This causes full table scans on large tables (e.g., OIDC tables, Child Profiles) and significant performance degradation during lookups.
**Action:** Manually add `@@index` to lookup fields in `schema.prisma` to optimize database query performance.
