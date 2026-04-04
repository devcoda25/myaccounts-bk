## 2024-10-24 - Missing Composite Indexes on Chronological Access Patterns
**Learning:** This codebase frequently performs queries that filter by a foreign key (e.g., `userId`, `childId`) and sort by a timestamp (e.g., `createdAt`, `at` desc), resulting in expensive in-memory sorts (filesorts) without explicit B-Tree composite indexes.
**Action:** Always verify access patterns in repository methods (like `findManyByChildId` with `orderBy: { at: 'desc' }`) and ensure matching `@@index([foreignKey, sortColumn])` exist in `prisma/schema.prisma` to prevent performance bottlenecks.
