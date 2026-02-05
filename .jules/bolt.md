## 2025-01-26 - [Missing Foreign Key Indexes in Prisma]
**Learning:** Prisma does not automatically index foreign key columns (e.g., `userId` in `UserCredential`). Queries filtering by these foreign keys (like `user.credentials`) perform full table scans unless `@@index([userId])` is explicitly added.
**Action:** Always verify `prisma/schema.prisma` relations and add `@@index` on foreign keys involved in frequent lookups.
