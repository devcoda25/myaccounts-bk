## 2024-06-03 - Database Chronological Query Optimization
**Learning:** Discovered that NestJS/Prisma applications frequently querying related models ordered by time (e.g., `findManyByChildId` sorted by `at`) suffer from expensive in-memory database sorts (filesorts) if composite indexes matching the foreign key and sort column are missing.
**Action:** Always add explicit composite indexes (like `@@index([childId, at])` or `@@index([parentId, createdAt])`) to models with chronological access patterns to ensure index-backed sorting.
