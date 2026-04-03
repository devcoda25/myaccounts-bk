## 2024-05-24 - [Missing composite indexes for chronological queries]
**Learning:** The database was performing expensive in-memory sorts because composite indexes covering foreign keys (`userId`, `childId`, `parentId`) and chronological columns like `createdAt` or `at` were missing. This is a critical performance bottleneck for this codebase, where chronological data is frequently fetched per user/child.
**Action:** Always verify access patterns and add composite indexes (e.g., `@@index([childId, at])`) on foreign keys and sort columns in `prisma/schema.prisma` to optimize performance.
